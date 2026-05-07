import "server-only";
import type { PodcastScript } from "./script";

// 헌법 v3.5 §15 line 28 — Gemini multi-speaker TTS.
// 출력: PCM L16 24kHz mono — WAV 헤더 wrapping 후 audio/wav 로 저장.
// PR-008 — 헌법 §15 5항 정합. 모델 ID는 GEMINI_MODEL_TTS env로 노출하여 출시 주기에 따른 업그레이드를 키 교체 없이.

const DEFAULT_TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Gemini prebuilt voices — multilingual (한국어 지원). 호스트 여 / 게스트 남.
const VOICE_MAP: Record<string, string> = {
  지윤: "Aoede",
  민수: "Puck",
};

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export async function generatePodcastAudio(script: PodcastScript): Promise<{
  audioWav: Buffer;
  durationSec: number;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const dialogueText = script.dialogue
    .map((line) => `${line.speaker}: ${line.text}`)
    .join("\n");

  const speakerVoiceConfigs = script.speakers.map((speaker) => ({
    speaker,
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: VOICE_MAP[speaker] ?? "Aoede",
      },
    },
  }));

  const ttsModel = process.env.GEMINI_MODEL_TTS ?? DEFAULT_TTS_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: dialogueText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: { speakerVoiceConfigs },
          },
        },
      }),
    },
  );
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini TTS API ${response.status}: ${errBody.slice(0, 300)}`);
  }
  const data = await response.json();
  const parts: Array<{ inlineData?: { data: string; mimeType: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const audioPart = parts.find((p) => p.inlineData);
  if (!audioPart?.inlineData?.data) {
    throw new Error("No audio in Gemini TTS response");
  }

  const pcmBuffer = Buffer.from(audioPart.inlineData.data, "base64");
  const audioWav = pcmToWav(pcmBuffer);
  // 24kHz mono 16-bit → bytes per second = 24000 * 1 * 2 = 48000
  const durationSec = Math.round(
    pcmBuffer.length / (SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8)),
  );
  return { audioWav, durationSec };
}

function pcmToWav(pcm: Buffer): Buffer {
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(
    SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8),
    28,
  );
  buffer.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);
  return buffer;
}
