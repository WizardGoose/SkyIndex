interface RecipeCountBadgeProps {
  count: number;
  label: string;
  variant: "green" | "fuchsia";
}

export const RecipeCountBadge = ({ count, label, variant }: RecipeCountBadgeProps) => {
  // The two variants are the input panel and the output panel on /recipes, so
  // they have to stay two colours. Each gradient now runs between two steps of
  // its OWN ramp: green used to fade into `emerald`, which is the site accent,
  // and fuchsia used to fade into `pink`, which is the one magenta ramp the
  // theme never remapped - so that badge stayed violet-pink no matter what the
  // tokens said. Both are single-hue now, and the pair reads green against blue.
  //
  // The label class below is read out by position, so each string has to keep
  // exactly four space-separated tokens with the text colour fourth.
  const variantClasses = {
    green: "from-green-500/15 to-green-400/15 border-green-500/20 text-green-400",
    fuchsia: "from-fuchsia-500/15 to-fuchsia-400/15 border-fuchsia-500/20 text-fuchsia-400",
  };

  const countClasses = {
    green: "text-green-300",
    fuchsia: "text-fuchsia-300",
  };

  return (
    <div className={`px-4 py-2 bg-gradient-to-r ${variantClasses[variant]} rounded-md border`}>
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-medium ${variantClasses[variant].split(" ")[3]}`}>{label}</span>
        <span className="text-slate-500">•</span>
        <span className={`font-semibold ${countClasses[variant]}`}>{count}</span>
      </div>
    </div>
  );
};
