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
}
