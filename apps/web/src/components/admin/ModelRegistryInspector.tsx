"use client";

import React, { useState } from "react";
import type { ModelDefinition, ModelCapability } from "@vox/contracts";

const INITIAL_MODEL_REGISTRY: ModelDefinition[] = [
  {
    modelId: "meta/muse-glimmer-30b",
    providerId: "meta",
    displayName: "Meta Muse Glimmer 30B",
    version: "3.0.0",
    capabilities: ["TEXT_GENERATION", "REASONING", "STRUCTURED_OUTPUT"],
    modalities: { inputs: ["text"], outputs: ["text"] },
    languages: ["ar", "en"],
    maxInput: 128000,
    maxOutput: 8192,
    qualityTier: "HIGH",
    speedTier: "BALANCED",
    costTier: "LOW",
    supportsStreaming: true,
    supportsBatch: true,
    supportsStructuredOutput: true,
    supportsImageReference: false,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    modelId: "zai/glm-5.2",
    providerId: "zai",
    displayName: "Z.AI GLM-5.2",
    version: "5.2.0",
    capabilities: ["TEXT_GENERATION", "REASONING", "STRUCTURED_OUTPUT", "VISION"],
    modalities: { inputs: ["text", "image"], outputs: ["text"] },
    languages: ["ar", "en", "zh"],
    maxInput: 200000,
    maxOutput: 16384,
    qualityTier: "PREMIUM",
    speedTier: "BALANCED",
    costTier: "MEDIUM",
    supportsStreaming: true,
    supportsBatch: false,
    supportsStructuredOutput: true,
    supportsImageReference: true,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    modelId: "qwen/qwen-image-edit",
    providerId: "qwen",
    displayName: "Qwen Image Edit",
    version: "2.5.0",
    capabilities: ["IMAGE_EDITING", "IMAGE_GENERATION"],
    modalities: { inputs: ["text", "image"], outputs: ["image"] },
    languages: ["ar", "en"],
    maxInput: 4096,
    maxOutput: 1,
    qualityTier: "HIGH",
    speedTier: "FAST",
    costTier: "LOW",
    supportsStreaming: false,
    supportsBatch: true,
    supportsStructuredOutput: false,
    supportsImageReference: true,
    supportsImageEditing: true,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
];

const CAPABILITY_COLORS: Record<ModelCapability, string> = {
  TEXT_GENERATION: "#3498DB",
  REASONING: "#9B59B6",
  STRUCTURED_OUTPUT: "#1ABC9C",
  VISION: "#F1C40F",
  IMAGE_GENERATION: "#E67E22",
  IMAGE_EDITING: "#E74C3C",
  VIDEO_GENERATION: "#FF3B30",
  VOICE_GENERATION: "#2ECC71",
  VOICE_TRANSCRIPTION: "#16A085",
  AUDIO_GENERATION: "#2980B9",
  EMBEDDINGS: "#8E44AD",
  UNKNOWN: "#95A5A6",
};

export default function ModelRegistryInspector() {
  const [selectedCapability, setSelectedCapability] = useState<string>("ALL");
  const [models] = useState<ModelDefinition[]>(INITIAL_MODEL_REGISTRY);

  const filteredModels = selectedCapability === "ALL"
    ? models
    : models.filter((m) => m.capabilities.includes(selectedCapability as ModelCapability));

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,25,45,0.95) 100%)",
      border: "1px solid rgba(155,89,182,0.25)",
      borderRadius: 16, padding: 24,
      fontFamily: "'Cairo', 'Inter', sans-serif",
      direction: "rtl",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #8E44AD, #3498DB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🤖</div>
        <div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
            سجل النماذج المزودة P0-I Model Registry
          </h3>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            {models.length} نموذج مسجل · نظام محايد عن المزودين (Provider-Agnostic)
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["ALL", "TEXT_GENERATION", "VISION", "IMAGE_EDITING", "VIDEO_GENERATION", "VOICE_GENERATION"].map((cap) => (
          <button
            key={cap}
            onClick={() => setSelectedCapability(cap)}
            style={{
              padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              background: selectedCapability === cap ? "rgba(142,68,173,0.3)" : "rgba(255,255,255,0.05)",
              color: selectedCapability === cap ? "#C39BD3" : "rgba(255,255,255,0.6)",
              fontWeight: selectedCapability === cap ? 700 : 400,
              fontSize: 11, transition: "all 0.2s",
            }}
          >
            {cap === "ALL" ? "الكل" : cap}
          </button>
        ))}
      </div>

      {/* Model Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filteredModels.map((m) => (
          <div key={m.modelId} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ margin: "0 0 2px 0", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                  {m.displayName}
                </h4>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                  {m.providerId} · v{m.version}
                </p>
              </div>
              <span style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                background: "rgba(46,204,113,0.15)", color: "#2ECC71",
              }}>
                {m.availability}
              </span>
            </div>

            {/* Capabilities badges */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {m.capabilities.map((cap) => (
                <span key={cap} style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
                  background: `${CAPABILITY_COLORS[cap] || "#95A5A6"}22`,
                  color: CAPABILITY_COLORS[cap] || "#95A5A6",
                  border: `1px solid ${CAPABILITY_COLORS[cap] || "#95A5A6"}44`,
                }}>{cap}</span>
              ))}
            </div>

            {/* Metrics */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
              background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 8, textAlign: "center",
            }}>
              <div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 9 }}>الجودة</p>
                <p style={{ margin: 0, color: "#3498DB", fontWeight: 700, fontSize: 11 }}>{m.qualityTier}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 9 }}>السرعة</p>
                <p style={{ margin: 0, color: "#2ECC71", fontWeight: 700, fontSize: 11 }}>{m.speedTier}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 9 }}>التكلفة</p>
                <p style={{ margin: 0, color: "#F1C40F", fontWeight: 700, fontSize: 11 }}>{m.costTier}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
