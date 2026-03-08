export default function GoogleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-foreground py-2.5 rounded-lg font-medium hover:bg-[hsl(var(--muted))] transition"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
}
