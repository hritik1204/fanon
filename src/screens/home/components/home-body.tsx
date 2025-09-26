import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useCallback } from "react";
import { Colors } from "@/src/constants/theme";
import { useRouter } from "expo-router";
import { arrayUnion, doc, DocumentData, updateDoc } from "firebase/firestore";

import {
  requestNotificationPermission,
  scheduleLocalNotification,
} from "@/src/utils/notifcation";
import { horizontalScaleConversion } from "@/src/utils";

import { useEvents } from "@/src/hooks/useEvents";
import { useDemoData } from "@/src/hooks/useDemoData";
import { auth, db } from "@/src/firebase";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useUserRoles } from "@/src/hooks/useUserRoles";

export const HomeBody = () => {
  const router = useRouter();

  // Custom hooks
  const { events, loading, eventCountRef, loadMore, updateEventCount } =
    useEvents();
  const { seeding, getDemoData } = useDemoData(eventCountRef, updateEventCount);
  const { userProfile } = useUserProfile();
  const { isAdmin } = useUserRoles(null, userProfile);



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

  const keyExtractor = useCallback((item: DocumentData) => String(item.id), []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: horizontalScaleConversion(190),
      offset: horizontalScaleConversion(190) * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: DocumentData }) => {
      const uid = auth.currentUser?.uid;
      const alreadyNotified = item.notifiedUsers?.includes(uid);

      const isLive = item.state === "live";
      const isScheduled = item.state === "scheduled";
      const eventStatus = isLive ? "Live" : isScheduled ? "Scheduled" : "Ended";

      async function onNotify() {
        if (!uid) {
          Alert.alert("Login required", "Please sign in to set notifications.");
          return;
        }
        const granted = await requestNotificationPermission();
        if (!granted) return;

        try {
          // schedule local notification
          await scheduleLocalNotification(item);

          // update Firestore
          const eRef = doc(db, "events", item.id);
          await updateDoc(eRef, {
            notifiedUsers: arrayUnion(uid),
          });
        } catch (err) {
          console.warn("Notify error", err);
        }
      }

      const handleEventCardClick = () => {
        if (isAdmin || isLive || !isScheduled) {
          router.push(`/event?id=${item.id}` as any);
        } else {
          Alert.alert("Event not live", "This event is not live yet.");
        }
      };

      return (
        <TouchableOpacity onPress={handleEventCardClick} style={[styles.card]}>
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
                    width: horizontalScaleConversion(10),
                    height: horizontalScaleConversion(10),
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
              style={[
                styles.btn,
                alreadyNotified ? { backgroundColor: "green" } : undefined,
              ]}
              onPress={onNotify}
              disabled={alreadyNotified}
            >
              <Text style={{ color: "white" }}>
                {alreadyNotified ? "Notified" : "Notify Me"}
              </Text>
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
    },
    [router, isAdmin]
  );

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
        windowSize={10}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              style={{ margin: horizontalScaleConversion(12) }}
            />
          ) : null
        }
        contentContainerStyle={{ padding: horizontalScaleConversion(12) }}
      />

      {isAdmin ? (
        <TouchableOpacity
          style={[styles.btn, { margin: horizontalScaleConversion(12) }]}
          onPress={getDemoData}
          disabled={seeding}
        >
          <Text style={{ color: "white" }}>
            {seeding ? "Seeding..." : "Seed Events"}
          </Text>
        </TouchableOpacity>
      ) : null}
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
    marginTop: horizontalScaleConversion(4),
  },
});
