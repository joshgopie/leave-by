export default function Header() {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Night"


  return (
    <div className="space-y-2">
      <p className="text-zinc-400">
        👋 {greeting}
      </p>

      <h1 className="text-5xl font-bold tracking-tight">
        Leave By 
      </h1>

      <p className="text-zinc-500">
        Never be late again.
      </p>
    </div>
  );
}