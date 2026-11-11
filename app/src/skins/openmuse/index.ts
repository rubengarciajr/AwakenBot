import type { Skin } from "../types";
import { OpenMuseFrame } from "./frame";
import { ActivityScreen } from "./screens/activity";
import { GoalsScreen } from "./screens/goals";
import { IdeasScreen } from "./screens/ideas";

/**
 * OpenMuse's look: one Bot at the centre of a single phone-shaped column and five tabs in a floating
 * pill. Its identity is the deployment's: the brand.yaml name and each Bot's own AwakenBot avatar.
 * Chat is AwakenBot's own conversation, and Apps is AwakenBot's own Connections page. Activity, Ideas
 * and Goals put AwakenBot's own sections for the centre Bot under OpenMuse's titles.
 */
export const openmuse: Skin = {
  id: "openmuse",
  name: "OpenMuse",
  description:
    "One Bot at the centre of a phone-shaped column, with five tabs.",
  Frame: OpenMuseFrame,
  screens: {
    activity: ActivityScreen,
    ideas: IdeasScreen,
    goals: GoalsScreen,
  },
};
