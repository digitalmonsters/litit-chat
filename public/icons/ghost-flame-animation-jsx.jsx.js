import { motion } from "framer-motion";

export default function GhostFlameIcon() {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      initial={{ scale: 1, filter: "drop-shadow(0 0 0px #FF5E3A)" }}
      animate={{
        scale: [1, 1.05, 1],
        filter: [
          "drop-shadow(0 0 10px #FF5E3A)",
          "drop-shadow(0 0 15px #FF9E57)",
          "drop-shadow(0 0 10px #FF5E3A)",
        ],
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF9E57" />
          <stop offset="100%" stopColor="#FF5E3A" />
        </linearGradient>
      </defs>
      <path
        d="M256 16c-55 42-72 109-70 150 2 41 26 74 26 74s-28-8-52-30c-32 48-18 114 25 152 52 46 144 42 192-8 48-50 54-136 12-184-14 15-40 27-40 27s24-36 23-74C370 60 316 18 256 16z"
        fill="url(#flameGrad)"
        stroke="#F6F5F3"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <circle cx="215" cy="250" r="18" fill="#1E1E1E" />
      <circle cx="297" cy="250" r="18" fill="#1E1E1E" />
      <path
        d="M160 400c30 24 60 28 96 0 36 28 66 24 96 0"
        stroke="#F6F5F3"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </motion.svg>
  );
}
