export type ArmiIntent =
  | { intent: "add_profile"; args: { name: string; phone?: string; tags?: string[]; notes?: string; relationshipType?: string } }
  | { intent: "edit_profile"; args: { profileId?: string; profileName?: string; updates: Record<string, string> } }
  | { intent: "schedule_text"; args: { profileName?: string; profileId?: string; when: string; message: string } }
  | { intent: "schedule_reminder"; args: { profileName?: string; profileId?: string; when: string; reason?: string } }
  | { intent: "none"; args: { explanation: string } };