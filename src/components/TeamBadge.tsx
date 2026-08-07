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
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border"
        style={{
          width: size,
          height: size,
          borderColor: "var(--color-hx-gold)",
          backgroundColor: "var(--color-hx-navy-light)",
        }}
        title={team.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external, admin-uploaded URLs */}
        <img
          src={team.crestUrl}
          alt={team.name}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border font-bold"
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
