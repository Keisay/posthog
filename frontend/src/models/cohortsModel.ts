import { kea } from 'kea'
import api from 'lib/api'
import { cohortsModelType } from './cohortsModelType'
import { CohortType } from '~/types'

const POLL_TIMEOUT = 5000

export const cohortsModel = kea<cohortsModelType<CohortType>>({
    actions: () => ({
        updateCohort: (cohort: CohortType) => ({ cohort }),
        createCohort: (cohort: CohortType) => ({ cohort }),
    }),

    loaders: () => ({
        cohorts: {
            __default: [] as CohortType[],
            loadCohorts: async () => {
                const response = await api.get('api/cohort')
                return response.results
            },
        },
    }),

    reducers: () => ({
        cohorts: {
            updateCohort: (state, { cohort }) => {
                if (!cohort) {
                    return state
                }
                return [...state].map((flag) => (flag.id === cohort.id ? cohort : flag))
            },
            createCohort: (state, { cohort }) => {
                if (!cohort) {
                    return state
                }
                return [cohort, ...state]
            },
            deleteCohort: (state, cohort) => {
                if (!cohort) {
                    return null
                }
                return [...state].filter((flag) => flag.id !== cohort.id)
            },
            deleteCohortSuccess: (state) => state,
        },
    }),

    listeners: ({ actions }) => ({
        loadCohortsSuccess: async ({ cohorts }: { cohorts: CohortType[] }, breakpoint) => {
            const is_calculating = cohorts.filter((cohort) => cohort.is_calculating).length > 0
            if (!is_calculating) {
                return
            }
            await breakpoint(POLL_TIMEOUT)
            actions.loadCohorts()
        },
    }),

    events: ({ actions }) => ({
        afterMount: actions.loadCohorts,
    }),
})
