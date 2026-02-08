interface LogoProps {
  size?: "small" | "large";
}

export const Logo = ({ size = "large" }: LogoProps) => {
  // RESPONSIVE SIZING:
  // Mobile: text-5xl | Desktop (md): text-8xl
  const baseSize =
    size === "large" ? "text-6xl md:text-9xl" : "text-3xl md:text-4xl";

  return (
    <div
      className={`${baseSize} font-black tracking-tighter select-none font-sans`}
    >
      {/* Main Text with a subtle drop shadow */}
      <span className="text-black drop-shadow-xl">MO</span>

      {/* THE TWIST: Gradient Text for X */}
      <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-600 drop-shadow-lg filter">
        X
      </span>

      <span className="text-black drop-shadow-xl">CET</span>

      {/* THE TWIST: Gradient Text for Y */}
      <span className="bg-clip-text text-transparent bg-linear-to-br from-purple-400 to-indigo-500 drop-shadow-lg filter">
        Y
      </span>
    </div>
  );
};
