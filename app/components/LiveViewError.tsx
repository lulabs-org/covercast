"use client";

type LiveViewErrorProps = {
  title: string;
  message: string;
};

export default function LiveViewError({ title, message }: LiveViewErrorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          fontSize: "120px",
          fontWeight: 900,
          color: "#ef4444",
          lineHeight: 1,
          marginBottom: "24px",
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          margin: 0,
          marginBottom: "16px",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "18px",
          maxWidth: "600px",
          lineHeight: 1.5,
          margin: 0,
          opacity: 0.7,
        }}
      >
        {message}
      </p>
    </div>
  );
}