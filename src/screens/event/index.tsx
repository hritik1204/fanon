// src/screens/EventScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ToastAndroid,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  writeBatch,
  runTransaction,
} from "firebase/firestore";

import { Colors } from "@/src/constants/theme";
import { auth, db } from "@/src/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/ui/header";
import { horizontalScaleConversion } from "@/src/utils";

type Question = {
  id: string;
  text: string;
  authorId: string;
  createdAt?: any;
  likes?: number;
  state?: "asked" | "answered" | "private";
  answerText?: string;
  answeredBy?: string;
  answeredAt?: any;
  // UI-only flags:
  pending?: boolean;
  selected?: boolean;
};

export default function EventScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tab, setTab] = useState<"asked" | "answered" | "private">("asked");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [submissionsPaused, setSubmissionsPaused] = useState(false);

  // derived roles
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // batch selection state (for admin)
  const [selectionMode, setSelectionMode] = useState(false);

  // rate limit toast: allow up to 2 toasts per minute
  const toastTimestampsRef = useRef<number[]>([]);

  // per-user submission rate limiting (client-side): allow max 5 posts per minute (dev)
  const submissionTimestampsRef = useRef<number[]>([]);

  // answer flow: which question is currently being answered (id) and drafts
  const [answerModeId, setAnswerModeId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  // track which questions the user has liked
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // load user profile doc
  useEffect(() => {
    if (!auth || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const uRef = doc(db, "users", uid);
    getDoc(uRef).then((snap) => {
      if (snap.exists()) {
        setUserProfile({ uid, ...(snap.data() as any) });
      } else {
        setUserProfile({ uid: uid });
      }
    });
  }, []);

  // Listen to event doc in realtime (no role checks here)
  useEffect(() => {
    if (!eventId) return;
    const eRef = doc(db, "events", eventId);
    const unsub = onSnapshot(
      eRef,
      (snap) => {
        if (!snap.exists()) {
          setEvent(null);
          return;
        }
        const d = { id: snap.id, ...(snap.data() as any) };
        setEvent(d);
        setSubmissionsPaused(Boolean(d.submissionsPaused));
      },
      (err) => {
        console.warn("event onSnapshot error:", err);
      }
    );
    return () => unsub();
  }, [eventId]);

  // Derive isAdmin/isGuest when either event or userProfile changes
  useEffect(() => {
    setIsAdmin(false);
    setIsGuest(false);
    const uid = auth?.currentUser?.uid;
    if (!uid) return;

    const globalAdmin = !!(userProfile && userProfile.isAdmin === true);
    const eventAdmin = !!(
      event &&
      Array.isArray(event.adminIds) &&
      event.adminIds.includes(uid)
    );
    const eventGuest = !!(
      event &&
      Array.isArray(event.guests) &&
      event.guests
        .map((g: any) => String(g).trim())
        .includes(String(uid).trim())
    );

    setIsAdmin(globalAdmin || eventAdmin);
    setIsGuest(eventGuest);
  }, [event, userProfile]);

  // Load user's likes when component mounts
  useEffect(() => {
    if (!auth?.currentUser || !eventId) return;
    const uid = auth.currentUser.uid;
    async function loadUserLikes() {
      try {
        const likesQuery = query(
          collection(db, "events", eventId, "questions"),
          limit(200)
        );
        const questionsSnap = await getDocs(likesQuery);
        const likedQuestionIds = new Set<string>();

        // Check each question's likes subcollection for user's like
        for (const questionDoc of questionsSnap.docs) {
          const likeDocRef = doc(
            db,
            "events",
            eventId,
            "questions",
            questionDoc.id,
            "likes",
            uid
          );
          const likeSnap = await getDoc(likeDocRef);
          if (likeSnap.exists()) {
            likedQuestionIds.add(questionDoc.id);
          }
        }

        setUserLikes(likedQuestionIds);
      } catch (err) {
        console.warn("loadUserLikes error:", err);
      }
    }

    loadUserLikes();
  }, [eventId]);

  // Load questions initially ordered by likes (requirement) then realtime merges
  useEffect(() => {
    if (!eventId) return;
    let unsubRealtime: (() => void) | null = null;
    let cancelled = false;

    async function initialLoadAndListen() {
      try {
        const qInitial = query(
          collection(db, "events", eventId, "questions"),
          orderBy("likes", "desc"),
          orderBy("createdAt", "asc"),
          limit(200)
        );
        const snap = await getDocs(qInitial);
        if (cancelled) return;
        const initial: Question[] = [];
        snap.forEach((d) => initial.push({ id: d.id, ...(d.data() as any) }));
        setQuestions(initial);

        const qRealtime = query(
          collection(db, "events", eventId, "questions"),
          orderBy("createdAt", "asc")
        );
        unsubRealtime = onSnapshot(qRealtime, (s) => {
          setQuestions((prev) => {
            const map = new Map<string, any>();
            prev.forEach((p) => map.set(p.id, p));
            s.docChanges().forEach((chg) => {
              const id = chg.doc.id;
              const data = { id, ...(chg.doc.data() as any) };
              if (chg.type === "removed") {
                map.delete(id);
              } else {
                map.set(id, data);
              }
            });
            return Array.from(map.values());
          });
        });
      } catch (err: any) {
        console.warn("initialLoadAndListen error:", err);
        // fallback to createdAt ordering
        try {
          const fallback = query(
            collection(db, "events", eventId, "questions"),
            orderBy("createdAt", "asc"),
            limit(200)
          );
          const snap2 = await getDocs(fallback);
          const initial2: Question[] = [];
          snap2.forEach((d) =>
            initial2.push({ id: d.id, ...(d.data() as any) })
          );
          setQuestions(initial2);
        } catch (e) {
          console.warn("fallback query failed", e);
        }
      }
    }

    initialLoadAndListen();

    return () => {
      cancelled = true;
      if (unsubRealtime) unsubRealtime();
    };
  }, [eventId]);

  // Helpers
  function showToast(message: string) {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      alert(message);
    }
  }

  function maybeShowAnsweredToast(answererName: string, qText: string) {
    const now = Date.now();
    toastTimestampsRef.current = toastTimestampsRef.current.filter(
      (t) => now - t < 60_000
    );
    if (toastTimestampsRef.current.length >= 2) {
      return;
    }
    toastTimestampsRef.current.push(now);
    showToast(`${answererName || "Guest"} answered: "${qText.slice(0, 60)}"`);
  }

  // posting a question
  async function postQuestion() {
    if (!auth?.currentUser) {
      Alert.alert("Sign in required", "Please sign in to post questions.");
      return;
    }
    if (!event) return Alert.alert("No event loaded");
    if (event.state !== "live") return Alert.alert("Event is not live");
    if (submissionsPaused)
      return Alert.alert("Submissions are temporarily paused");

    const now = Date.now();
    submissionTimestampsRef.current = submissionTimestampsRef.current.filter(
      (t) => now - t < 60_000
    );
    if (submissionTimestampsRef.current.length >= 5) {
      return Alert.alert(
        "Rate limit",
        "You're submitting too fast. Try again in a moment."
      );
    }

    const uid = auth.currentUser.uid;
    setPosting(true);
    try {
      const qRef = collection(db, "events", eventId, "questions");
      await addDoc(qRef, {
        text: text.trim(),
        authorId: uid,
        createdAt: serverTimestamp(),
        likes: 0,
        state: "asked",
      });
      submissionTimestampsRef.current.push(now);
      setText("");
    } catch (err) {
      console.warn("postQuestion", err);
      Alert.alert("Failed", "Could not post question. Try again.");
    } finally {
      setPosting(false);
    }
  }

  // like a question — toggle using a likes subcollection per question to enforce one-like-per-user
  async function likeQuestion(q: Question) {
    if (!auth?.currentUser) {
      Alert.alert("Sign in required", "Please sign in to like.");
      return;
    }
    const uid = auth.currentUser.uid;
    const qDocRef = doc(db, "events", eventId, "questions", q.id);
    const likeDocRef = doc(
      db,
      "events",
      eventId,
      "questions",
      q.id,
      "likes",
      uid
    );

    try {
      await runTransaction(db, async (tx) => {
        const qSnap = await tx.get(qDocRef);
        if (!qSnap.exists()) throw new Error("Question missing");
        const likeSnap = await tx.get(likeDocRef);
        const currentLikes = qSnap.data().likes || 0;

        if (likeSnap.exists()) {
          // user already liked -> unlike: remove like doc and decrement counter
          tx.delete(likeDocRef);
          tx.update(qDocRef, { likes: Math.max(0, currentLikes - 1) });
          // Update local state
          setUserLikes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(q.id);
            return newSet;
          });
        } else {
          // add like doc and increment counter
          tx.set(likeDocRef, { uid, createdAt: serverTimestamp() });
          tx.update(qDocRef, { likes: currentLikes + 1 });
          // Update local state
          setUserLikes((prev) => {
            const newSet = new Set(prev);
            newSet.add(q.id);
            return newSet;
          });
        }
      });
    } catch (err) {
      console.warn("likeQuestion error", err);
      Alert.alert("Like failed", "Could not register your like. Try again.");
    }
  }

  // start answering flow: open inline text input for that question
  function startAnswerFlow(q: Question) {
    setAnswerModeId(q.id);
    setAnswerDrafts((s) => ({ ...s, [q.id]: s[q.id] ?? "" }));
  }

  function cancelAnswerFlow(qid: string) {
    setAnswerModeId(null);
    setAnswerDrafts((s) => {
      const copy = { ...s };
      delete copy[qid];
      return copy;
    });
  }

  // submit answer: update question doc with answer text + mark answered
  async function submitAnswer(q: Question) {
    if (!auth?.currentUser) {
      Alert.alert("Sign in required", "Please sign in to answer.");
      return;
    }
    if (!isGuest && !isAdmin) {
      return Alert.alert(
        "Not allowed",
        "Only a guest or admin can answer questions."
      );
    }
    const draft = (answerDrafts[q.id] || "").trim();
    if (!draft)
      return Alert.alert("Empty", "Please type an answer before submitting.");

    try {
      const qDoc = doc(db, "events", eventId, "questions", q.id);
      await updateDoc(qDoc, {
        state: "answered",
        answerText: draft,
        answeredBy: auth.currentUser.uid,
        answeredAt: serverTimestamp(),
      });
      // show toast (rate-limited)
      maybeShowAnsweredToast(userProfile?.displayName || "Guest", q.text);
      // clear answer UI
      cancelAnswerFlow(q.id);
    } catch (err) {
      console.warn("submitAnswer", err);
      Alert.alert("Failed", "Could not submit answer. Try again.");
    }
  }

  // dismiss (make private)
  async function dismissQuestion(q: Question) {
    if (!auth?.currentUser) return;
    if (!isGuest && !isAdmin) {
      return Alert.alert(
        "Not allowed",
        "Only a guest or admin can dismiss questions."
      );
    }
    try {
      const qDoc = doc(db, "events", eventId, "questions", q.id);
      await updateDoc(qDoc, { state: "private" });
    } catch (err) {
      console.warn("dismissQuestion", err);
    }
  }

  // admin single delete
  async function adminDeleteQuestions(ids: string[]) {
    if (!isAdmin) return Alert.alert("Not allowed");
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const d = doc(db, "events", eventId, "questions", id);
        batch.delete(d);
      });
      await batch.commit();
      setSelectionMode(false);
    } catch (err) {
      console.warn("adminDeleteQuestions", err);
      Alert.alert("Failed", "Could not delete questions.");
    }
  }

  // admin recover
  async function adminRecoverQuestion(id: string) {
    if (!isAdmin) return;
    try {
      const qDoc = doc(db, "events", eventId, "questions", id);
      await updateDoc(qDoc, { state: "asked" });
    } catch (err) {
      console.warn("adminRecoverQuestion", err);
      Alert.alert("Failed", "Could not recover question.");
    }
  }

  // Admin: start / end / toggle pause
  async function adminStartEvent() {
    if (!isAdmin || isGuest || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, { state: "live", startedAt: serverTimestamp() });
    } catch (err) {
      console.warn("adminStartEvent", err);
    }
  }
  async function adminEndEvent() {
    if ((!isAdmin && !isGuest) || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, { state: "ended", endedAt: serverTimestamp() });
    } catch (err) {
      console.warn("adminEndEvent", err);
    }
  }
  async function adminTogglePause() {
    if ((!isAdmin && !isGuest) || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, {
        submissionsPaused: !Boolean(event?.submissionsPaused),
      });
    } catch (err) {
      console.warn("adminTogglePause", err);
    }
  }

  // Batch actions (use when selectionMode true)
  function toggleSelectQuestion(id: string) {
    setQuestions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }
  function selectedIds() {
    return questions.filter((q) => q.selected).map((q) => q.id);
  }
  async function runBatchDeleteSelected() {
    const ids = selectedIds();
    if (ids.length === 0)
      return Alert.alert("No selection", "Select questions first.");
    if (!isAdmin) return Alert.alert("Not allowed");
    try {
      await adminDeleteQuestions(ids);
    } catch (err) {
      console.warn("runBatchDeleteSelected", err);
    }
  }
  async function runBatchRecoverSelected() {
    const ids = selectedIds();
    if (ids.length === 0)
      return Alert.alert("No selection", "Select questions first.");
    if (!isAdmin) return Alert.alert("Not allowed");
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const d = doc(db, "events", eventId, "questions", id);
        batch.update(d, { state: "asked" });
      });
      await batch.commit();
      setSelectionMode(false);
    } catch (err) {
      console.warn("runBatchRecoverSelected", err);
      Alert.alert("Failed", "Could not recover selected questions.");
    }
  }

  // Filtering + sorting for each tab
  const filteredQuestions = useMemo(() => {
    const arr = questions.filter((q) => (q.state || "asked") === tab);
    if (tab === "asked") {
      return arr.sort(
        (a, b) =>
          (b.likes || 0) - (a.likes || 0) ||
          (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
    }
    if (tab === "answered") {
      return arr.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
    }
    // private
    return arr.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  }, [questions, tab]);

  function renderQuestion({ item }: { item: Question }) {
    const answering = answerModeId === item.id;

    return (
      <View style={styles.questionCard}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.qText}>{item.text}</Text>
          {selectionMode && isAdmin ? (
            <TouchableOpacity
              onPress={() => toggleSelectQuestion(item.id)}
              style={{ padding: 8 }}
            >
              <Text
                style={{
                  color: item.selected ? Colors.light.background : "#999",
                }}
              >
                {item.selected ? "✓" : "◻"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* If answered, show answer text */}
        {item.state === "answered" && item.answerText ? (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: "#9fd", fontStyle: "italic" }}>
              Answer: {item.answerText}
            </Text>
            <Text style={{ color: "#666", fontSize: 12 }}>
              {item.answeredBy ? `By ${item.answeredBy}` : ""}
            </Text>
          </View>
        ) : null}

        {/* Inline answer input when answering */}
        {answering ? (
          <View
            style={{
              marginTop: 8,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TextInput
              value={answerDrafts[item.id] ?? ""}
              onChangeText={(t) =>
                setAnswerDrafts((s) => ({ ...s, [item.id]: t }))
              }
              placeholder="Type your answer..."
              placeholderTextColor="#777"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#333",
                padding: 8,
                borderRadius: 6,
                color: "white",
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={() => submitAnswer(item)}
              style={[styles.qBtn]}
            >
              <Text style={styles.qBtnText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => cancelAnswerFlow(item.id)}
              style={[styles.qBtn, { marginLeft: 8, backgroundColor: "#666" }]}
            >
              <Text style={styles.qBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.qRow}>
          <Text style={styles.qMeta}>Likes: {item.likes ?? 0}</Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => likeQuestion(item)}
              style={[styles.qBtn, userLikes.has(item.id) && styles.qBtnLiked]}
            >
              <Text
                style={[
                  styles.qBtnText,
                  userLikes.has(item.id) && styles.qBtnTextLiked,
                ]}
              >
                {userLikes.has(item.id) ? "Unlike" : "Like"}
              </Text>
            </TouchableOpacity>

            {((isGuest && tab === "asked") || isAdmin) && !answering && (
              <>
                <TouchableOpacity
                  onPress={() => startAnswerFlow(item)}
                  style={styles.qBtn}
                >
                  <Text style={styles.qBtnText}>Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dismissQuestion(item)}
                  style={styles.qBtn}
                >
                  <Text style={styles.qBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </>
            )}

            {isAdmin && !selectionMode && (
              <>
                <TouchableOpacity
                  onPress={() => adminDeleteQuestions([item.id])}
                  style={styles.qBtnDanger}
                >
                  <Text style={styles.qBtnText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adminRecoverQuestion(item.id)}
                  style={styles.qBtn}
                >
                  <Text style={styles.qBtnText}>Recover</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="white" />
        <Text style={{ color: "#aaa", marginTop: 8 }}>Loading event…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header headerName={event.title || "Event"} />
      <Image source={{ uri: event.imageUrl }} style={styles.banner} />
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.small}>State: {event.state}</Text>
        <Text style={{ color: "#888", marginTop: 4 }}>
          {event.startTime
            ? new Date(event.startTime.seconds * 1000).toLocaleString()
            : "TBD"}
        </Text>
      </View>

      {/* Admin controls */}
      {(isAdmin || isGuest) && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: horizontalScaleConversion(12),
          }}
        >
          <TouchableOpacity onPress={adminStartEvent} style={[styles.adminBtn]}>
            <Text style={{ color: "white" }}>Start Event</Text>
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity onPress={adminEndEvent} style={[styles.adminBtn]}>
            <Text style={{ color: "white" }}>End Event</Text>
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity
            onPress={adminTogglePause}
            style={[
              styles.adminBtn,
              {
                backgroundColor: event?.submissionsPaused ? "#8b2b2b" : "#444",
              },
            ]}
          >
            <Text style={{ color: "white" }}>
              {event?.submissionsPaused
                ? "Resume Submissions"
                : "Pause Submissions"}
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => setSelectionMode((s) => !s)}
            style={[
              styles.adminBtn,
              { backgroundColor: selectionMode ? "#2b6ebf" : "#444" },
            ]}
          >
            <Text style={{ color: "white" }}>
              {selectionMode ? "Exit Select" : "Select"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post box */}
      <View style={styles.postBox}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={
            event.state === "live"
              ? "Ask a question..."
              : "Questions are closed"
          }
          placeholderTextColor="#777"
          style={[
            styles.input,
            event.state !== "live" || submissionsPaused
              ? { opacity: 0.6 }
              : null,
          ]}
          editable={event.state === "live" && !submissionsPaused}
        />
        <TouchableOpacity
          onPress={postQuestion}
          style={[
            styles.postBtn,
            {
              backgroundColor:
                event.state === "live" && !submissionsPaused
                  ? Colors.light.background
                  : "#666",
            },
          ]}
          disabled={posting || event.state !== "live" || submissionsPaused}
        >
          <Text
            style={{
              color: event?.state === "live" ? "#000" : "white",
              fontWeight: "700",
            }}
          >
            {posting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab("asked")}
          style={[styles.tabBtn, tab === "asked" && styles.tabActive]}
        >
          <Text style={tab === "asked" ? styles.tabActiveText : styles.tabText}>
            Asked
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("answered")}
          style={[styles.tabBtn, tab === "answered" && styles.tabActive]}
        >
          <Text
            style={tab === "answered" ? styles.tabActiveText : styles.tabText}
          >
            Answered
          </Text>
        </TouchableOpacity>
        {(isAdmin || isGuest) && (
          <TouchableOpacity
            onPress={() => setTab("private")}
            style={[styles.tabBtn, tab === "private" && styles.tabActive]}
          >
            <Text
              style={tab === "private" ? styles.tabActiveText : styles.tabText}
            >
              Private
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Batch action footer */}
      {selectionMode && isAdmin && (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingBottom: 8,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={runBatchDeleteSelected}
            style={[styles.adminBtn, { backgroundColor: "#8b2b2b" }]}
          >
            <Text style={{ color: "white" }}>Delete Selected</Text>
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity
            onPress={runBatchRecoverSelected}
            style={[styles.adminBtn]}
          >
            <Text style={{ color: "white" }}>Recover Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredQuestions}
        renderItem={renderQuestion}
        keyExtractor={(i) => i.id}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.black },
  banner: { width: "100%", height: 220, backgroundColor: "#222" },
  header: { padding: 12 },
  title: { color: "white", fontSize: 20, fontWeight: "600" },
  small: { color: "#999", marginTop: 4 },
  postBox: { flexDirection: "row", padding: 12, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    padding: 8,
    color: "white",
    borderRadius: 6,
    marginRight: 8,
  },
  postBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  tabs: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8 },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
  },
  tabActive: { backgroundColor: "#2b6ebf" },
  tabText: { color: "#bbb" },
  tabActiveText: { color: "white" },
  questionCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  qText: { color: "white", fontSize: 16, marginBottom: 8 },
  qRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qMeta: { color: "#aaa" },
  qBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#444",
  },
  qBtnLiked: {
    backgroundColor: "#2b6ebf",
  },
  qBtnDanger: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#8b2b2b",
  },
  qBtnText: { color: "white" },
  qBtnTextLiked: { color: "white", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  adminBtn: {
    backgroundColor: "#444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
  },
});
