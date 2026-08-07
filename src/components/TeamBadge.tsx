import type { TeamDefinition } from "@/content/teams";

export function TeamBadge({
  team,
  size = 40,
}: {
  team: TeamDefinition;
  size?: number;
}) {
  if (team.crestUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, admin-uploaded URLs
      <img
        src={team.crestUrl}
        alt={team.name}
        title={team.name}
        className="shrink-0 rounded-full border object-cover"
        style={{ width: size, height: size, borderColor: "var(--color-hx-gold)" }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: team.primaryColor,
        color: team.secondaryColor,
        borderColor: "var(--color-hx-gold)",
        fontSize: size * 0.35,
      }}
      title={team.name}
    >
      {team.tag.replace(/[^A-Za-z0-9]/g, "").slice(0, 2)}
    </div>
  );
}
