// src/helper/demo-events.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/firebase";


const demoImages = [
  "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_450,c_fill/sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_450,c_fill/beach.jpg",
  "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_450,c_fill/dog.jpg",
  "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_450,c_fill/kitten.jpg",
];


export async function seedDemoEvents(count = 5, startFrom: number) {
  const created: string[] = [];

  for (let i = startFrom; i < count + startFrom; i++) {
    const start = new Date(Date.now() + (i + 1) * 60 * 60 * 1000); // 1h, 2h, 3h later...
    const imageUrl = demoImages[i % demoImages.length];

    try {
      const docRef = await addDoc(collection(db, "events"), {
        title: `${i % 2 === 0 ? "Ask-Me-Anything" : "Watch-Party"} #${i + 1}`,
        type: i % 2 === 0 ? "AMA" : "WATCHPARTY",
        state: "scheduled",
        imageUrl,
        startTime: start,
        submissionsPaused: false,
        createdAt: serverTimestamp(),
      });
      created.push(docRef.id);
    } catch (err) {
      console.warn("seedDemoEvents: failed to create event", err);
    }
  }

  console.log(`✅ Seeded ${created.length} demo events`);
  return created;
}
