import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Colors } from "@/src/constants/theme";
import { useRouter } from "expo-router";

import {
  collection,
  query,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  startAfter,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/src/firebase";
import {
  addNotificationResponseListener,
  scheduleLocalNotification,
} from "@/src/utils/notifcation";
import { seedDemoEvents } from "@/src/helper/demo-events";
import { horizontalScaleConversion } from "@/src/utils";
import { doSignOut } from "@/src/auth";

const PAGE_SIZE = 8;

export const HomeBody = () => {
  const router = useRouter();
  const [events, setEvents] = useState<DocumentData[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const eventCountRef = useRef<number>(0);

  useEffect(() => {
    // --- Real-time listener for the first page ---
    const q = query(
      collection(db, "events"),
      orderBy("startTime", "asc"),
      limit(PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: any[] = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

        setEvents(docs);
        if (!snap.empty) {
          setLastDoc(snap.docs[snap.docs.length - 1]);

          setHasMore(snap.size >= PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      },
      (err) => {
        console.warn("Realtime listener error:", err);
      }
    );

    // --- Push notification deep link listener ---
    let sub: any;
    (async () => {
      sub = await addNotificationResponseListener((response) => {
        const eventId = response.notification.request.content.data?.eventId;
        if (eventId) router.push(`/event/${eventId}` as any);
      });
    })();

    return () => {
      unsub();
      if (sub) sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const coll = collection(db, "events");
        const snapshot = await getCountFromServer(coll);
        if (isMounted) {
          eventCountRef.current = snapshot.data().count;
        }
      } catch (e) {
        console.warn("Failed to get total events count", e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadMore() {
    if (loading || !hasMore || !lastDoc) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "events"),
        orderBy("startTime", "asc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const docs: any[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

      setEvents((prev) => [...prev, ...docs]);

      if (!snap.empty) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
        if (snap.size < PAGE_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }

  function toDate(tsOrDate: any) {
    if (!tsOrDate) return null;
    if (tsOrDate.seconds && typeof tsOrDate.seconds === "number") {
      return new Date(tsOrDate.seconds * 1000);
    }
    if (tsOrDate.toDate) {
      return tsOrDate.toDate();
    }
    return new Date(tsOrDate);
  }

  async function getDemoData() {
    setSeeding(true);
    await seedDemoEvents(5, eventCountRef.current);
    try {
      const snapshot = await getCountFromServer(collection(db, "events"));
      eventCountRef.current = snapshot.data().count;
    } finally {
      setSeeding(false);
    }
  }

  async function handleSignOut() {
    try {
      await doSignOut();
      router.replace("/sign-in"); // send user back to sign-in
    } catch (e) {
      console.warn("Sign-out failed", e);
    }
  }

  const keyExtractor = useCallback((item: DocumentData) => String(item.id), []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: horizontalScaleConversion(190),
      offset: 72 * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(({ item }: { item: DocumentData }) => {
    const isLive = item.state === "live";
    const isScheduled = item.state === "scheduled";
    const eventStatus = isLive ? "Live" : isScheduled ? "Scheduled" : "Ended";
    return (
      <TouchableOpacity
        onPress={() => router.push(`/event?id=${item.id}` as any)}
        style={[styles.card]}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>
              {toDate(item.startTime)?.toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }) ?? "TBD"}
            </Text>
            <View style={styles.eventStatus}>
              <View
                style={{
                  borderRadius: 100,
                  width: 10,
                  height: 10,
                  backgroundColor: isLive
                    ? "green"
                    : isScheduled
                    ? "yellow"
                    : "red",
                }}
              />
              <Text style={styles.subtitle}>{eventStatus}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => scheduleLocalNotification(item)}
          >
            <Text style={{ color: "white" }}>Notify Me</Text>
          </TouchableOpacity>
          {/* <View style={{ width: 12 }} /> */}
          {/* <TouchableOpacity
              onPress={() => router.push(`/event/${item.id}` as any)}
            >
              <Text style={{ color: "#2b6ebf", alignSelf: "center" }}>
                Open
              </Text>
            </TouchableOpacity> */}
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={keyExtractor}
        decelerationRate={"fast"}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        getItemLayout={getItemLayout}
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              style={{ margin: horizontalScaleConversion(12) }}
            />
          ) : null
        }
        contentContainerStyle={{ padding: horizontalScaleConversion(12) }}
      />
      <TouchableOpacity
        style={[styles.btn, { margin: horizontalScaleConversion(12) }]}
        onPress={handleSignOut}
        // disabled={seeding}
      >
        <Text style={{ color: "white" }}>{"logout"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { margin: horizontalScaleConversion(12) }]}
        onPress={getDemoData}
        disabled={seeding}
      >
        <Text style={{ color: "white" }}>
          {seeding ? "Seeding..." : "Seed Events"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  card: {
    marginBottom: horizontalScaleConversion(12),
    backgroundColor: Colors.dark.black,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: { width: "100%", height: horizontalScaleConversion(160) },
  title: {
    fontSize: horizontalScaleConversion(18),
    color: "#fff",
    marginBottom: horizontalScaleConversion(4),
  },
  subtitle: { color: "#aaa" },
  btn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: horizontalScaleConversion(12),
    paddingVertical: horizontalScaleConversion(8),
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  info: {
    paddingVertical: horizontalScaleConversion(12),
    paddingHorizontal: horizontalScaleConversion(12),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScaleConversion(4),
    marginTop: horizontalScaleConversion(4)
  }
});
