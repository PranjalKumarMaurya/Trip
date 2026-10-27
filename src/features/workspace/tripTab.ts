import type { MyGroupAccess } from '../groups/myGroupAccess'
import type { RosterMember } from '../groups/useGroupRoster'

/**
 * Every Trip tab receives the selected Trip and its roster. Tabs are remounted
 * when the Trip changes, so no state from another Trip can leak in.
 */
export interface TripTabProps {
  trip: MyGroupAccess
  roster: RosterMember[]
  reloadRoster: () => void
  /**
   * Re-read the caller's Trip list (role, membership, archive state) after a
   * change such as leaving, a role change, or archiving. The workspace keeps the
   * current tab mounted while it refreshes; a Trip the caller lost disappears.
   */
  onTripsChanged?: () => void
}
