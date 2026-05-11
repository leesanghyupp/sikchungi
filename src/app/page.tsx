import type { Metadata } from "next";
import { ChatClient } from "./_ChatClient";

export const metadata: Metadata = {
  title: "식충이 — 음식 추천 잼민이 친구",
  description: "뭐 먹지? 식충이가 골라줌 🤤",
};

export default function HomePage() {
  return <ChatClient />;
}
