import db from "@/lib/db";

export async function getFullUserProfile(clerkId: string) {
  const res = await db.query(
    `
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.job_title,
      u.organization,
      u.preferred_frequency,
      u.preferred_formats,

      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT c.name)
         FROM user_communities uc
         LEFT JOIN communities c ON c.id = uc.community_id
         WHERE uc.user_id = u.id), '{}'
      ) AS communities,

      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT sc.name)
         FROM user_communities uc
         LEFT JOIN sub_communities sc ON sc.id = uc.sub_community_id
         WHERE uc.user_id = u.id), '{}'
      ) AS sub_communities,

      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT i.name)
         FROM user_industries ui
         LEFT JOIN industry i ON i.id = ui.industry_id
         WHERE ui.user_id = u.id), '{}'
      ) AS industries,

      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT si.name)
         FROM user_industries ui
         LEFT JOIN sub_industries si ON si.id = ui.sub_industry_id
         WHERE ui.user_id = u.id), '{}'
      ) AS sub_industries

    FROM users u
    WHERE u.clerk_id = $1
    `,
    [clerkId]
  );

  return res.rows[0];
}