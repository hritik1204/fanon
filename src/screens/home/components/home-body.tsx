import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useCallback } from "react";
import { Colors } from "@/src/constants/theme";
import { useRouter } from "expo-router";
import { DocumentData } from "firebase/firestore";

import { scheduleLocalNotification } from "@/src/utils/notifcation";
import { horizontalScaleConversion } from "@/src/utils";
import { doSignOut } from "@/src/auth";
import { useEvents } from "@/src/hooks/useEvents";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useDemoData } from "@/src/hooks/useDemoData";

export const HomeBody = () => {
  const router = useRouter();
  
  // Custom hooks 
  const { events, loading, eventCountRef, loadMore, updateEventCount } = useEvents();
  const { seeding, getDemoData } = useDemoData(eventCountRef, updateEventCount);
  
  // Setup notification listener
  useNotifications();

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
      offset: horizontalScaleConversion(72) * index,
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
  }, [router]);

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
        windowSize={horizontalScaleConversion(5)}
        initialNumToRender={horizontalScaleConversion(10)}
        maxToRenderPerBatch={horizontalScaleConversion(10)}
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
