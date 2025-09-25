// src/screens/EventScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { updateDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { Colors } from "@/src/constants/theme";
import { db } from "@/src/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/ui/header";
import { horizontalScaleConversion } from "@/src/utils";

// Custom hooks
import { useEvent } from "@/src/hooks/useEvent";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useUserRoles } from "@/src/hooks/useUserRoles";
import { useQuestions } from "@/src/hooks/useQuestions";
import { useEventActions } from "@/src/hooks/useEventActions";

// Components
import {
  QuestionCard,
  AdminControls,
  PostBox,
  QuestionTabs,
  BatchActionFooter,
} from "@/src/components/event";

export default function EventScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<"asked" | "answered" | "private">("asked");
  const [text, setText] = useState("");

  // Custom hooks for data and logic
  const { event, submissionsPaused } = useEvent(eventId);
  const { userProfile } = useUserProfile();
  const { isAdmin, isGuest } = useUserRoles(event, userProfile);
  const { questions, filteredQuestions, setQuestions } = useQuestions(eventId, tab);
  const {
    posting,
    selectionMode,
    setSelectionMode,
    userLikes,
    answerModeId,
    answerDrafts,
    postQuestion,
    likeQuestion,
    submitAnswer,
    dismissQuestion,
    startAnswerFlow,
    cancelAnswerFlow,
    updateAnswerDraft,
    adminDeleteQuestions,
    adminRecoverQuestion,
  } = useEventActions(eventId, userProfile);

  // Helper functions for admin controls
  const adminStartEvent = useCallback(async () => {
    if (!isAdmin || isGuest || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, { state: "live", startedAt: serverTimestamp() });
    } catch (err) {
      console.warn("adminStartEvent", err);
    }
  }, [isAdmin, isGuest, eventId]);

  const adminEndEvent = useCallback(async () => {
    if ((!isAdmin && !isGuest) || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, { state: "ended", endedAt: serverTimestamp() });
    } catch (err) {
      console.warn("adminEndEvent", err);
    }
  }, [isAdmin, isGuest, eventId]);

  const adminTogglePause = useCallback(async () => {
    if ((!isAdmin && !isGuest) || !eventId) return;
    try {
      const eRef = doc(db, "events", eventId);
      await updateDoc(eRef, {
        submissionsPaused: !Boolean(event?.submissionsPaused),
      });
    } catch (err) {
      console.warn("adminTogglePause", err);
    }
  }, [isAdmin, isGuest, eventId, event?.submissionsPaused]);

  // Batch operations
  const toggleSelectQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  }, [setQuestions]);

  const selectedIds = useCallback(() => {
    return questions.filter((q) => q.selected).map((q) => q.id);
  }, [questions]);

  const runBatchDeleteSelected = useCallback(async () => {
    const ids = selectedIds();
    if (ids.length === 0)
      return Alert.alert("No selection", "Select questions first.");
    if (!isAdmin) return Alert.alert("Not allowed");
    try {
      await adminDeleteQuestions(ids, isAdmin);
    } catch (err) {
      console.warn("runBatchDeleteSelected", err);
    }
  }, [selectedIds, isAdmin, adminDeleteQuestions]);

  const runBatchRecoverSelected = useCallback(async () => {
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
  }, [selectedIds, isAdmin, eventId, setSelectionMode]);

  // Event handlers
  const handlePostQuestion = useCallback(async () => {
    if (!event) return Alert.alert("No event loaded");
    if (event.state !== "live") return Alert.alert("Event is not live");
    if (submissionsPaused)
      return Alert.alert("Submissions are temporarily paused");

    await postQuestion(text);
    setText("");
  }, [event, submissionsPaused, postQuestion, text]);

  const handleLikeQuestion = useCallback(
    (question: any) => likeQuestion(question),
    [likeQuestion]
  );

  const handleSubmitAnswer = useCallback(
    (question: any) => submitAnswer(question, isGuest, isAdmin),
    [submitAnswer, isGuest, isAdmin]
  );

  const handleDismissQuestion = useCallback(
    (question: any) => dismissQuestion(question, isGuest, isAdmin),
    [dismissQuestion, isGuest, isAdmin]
  );

  const handleDeleteQuestions = useCallback(
    (ids: string[]) => adminDeleteQuestions(ids, isAdmin),
    [adminDeleteQuestions, isAdmin]
  );

  const handleRecoverQuestion = useCallback(
    (id: string) => adminRecoverQuestion(id, isAdmin),
    [adminRecoverQuestion, isAdmin]
  );

  const renderQuestion = useCallback(
    ({ item }: { item: any }) => (
      <QuestionCard
        question={item}
        userLikes={userLikes}
        answerModeId={answerModeId}
        answerDrafts={answerDrafts}
        isGuest={isGuest}
        isAdmin={isAdmin}
        selectionMode={selectionMode}
        tab={tab}
        onToggleSelect={toggleSelectQuestion}
        onLike={handleLikeQuestion}
        onStartAnswer={startAnswerFlow}
        onCancelAnswer={cancelAnswerFlow}
        onSubmitAnswer={handleSubmitAnswer}
        onDismiss={handleDismissQuestion}
        onDelete={handleDeleteQuestions}
        onRecover={handleRecoverQuestion}
        onUpdateAnswerDraft={updateAnswerDraft}
      />
    ),
    [
      userLikes,
      answerModeId,
      answerDrafts,
      isGuest,
      isAdmin,
      selectionMode,
      tab,
      toggleSelectQuestion,
      handleLikeQuestion,
      startAnswerFlow,
      cancelAnswerFlow,
      handleSubmitAnswer,
      handleDismissQuestion,
      handleDeleteQuestions,
      handleRecoverQuestion,
      updateAnswerDraft,
    ]
  );

  if (!event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="white" />
        <Text style={{ color: "#aaa", marginTop: horizontalScaleConversion(8) }}>
          Loading event…
        </Text>
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
        <Text style={{ color: "#888", marginTop: horizontalScaleConversion(4) }}>
          {event.startTime
            ? new Date(event.startTime.seconds * 1000).toLocaleString()
            : "TBD"}
        </Text>
      </View>

      <AdminControls
        isAdmin={isAdmin}
        isGuest={isGuest}
        event={event}
        selectionMode={selectionMode}
        onStartEvent={adminStartEvent}
        onEndEvent={adminEndEvent}
        onTogglePause={adminTogglePause}
        onToggleSelection={() => setSelectionMode((s) => !s)}
      />

      <PostBox
        text={text}
        posting={posting}
        eventState={event.state}
        submissionsPaused={submissionsPaused}
        onTextChange={setText}
        onPost={handlePostQuestion}
      />

      <QuestionTabs
        tab={tab}
        isAdmin={isAdmin}
        isGuest={isGuest}
        onTabChange={setTab}
      />

      <BatchActionFooter
        isVisible={selectionMode}
        isAdmin={isAdmin}
        onBatchDelete={runBatchDeleteSelected}
        onBatchRecover={runBatchRecoverSelected}
      />

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
  container: {
    flex: 1,
    backgroundColor: Colors.dark.black,
    paddingBottom: horizontalScaleConversion(60),
  },
  banner: {
    width: "100%",
    height: horizontalScaleConversion(220),
    backgroundColor: "#222",
  },
  header: { padding: horizontalScaleConversion(12) },
  title: {
    color: "white",
    fontSize: horizontalScaleConversion(20),
    fontWeight: "600",
  },
  small: { color: "#999", marginTop: horizontalScaleConversion(4) },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
