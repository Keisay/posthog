import React from 'react'
import { ActionEdit } from './ActionEdit'
import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { userLogic } from 'scenes/userLogic'
import { eventsTableLogic } from 'scenes/events/eventsTableLogic'
import api from 'lib/api'
import { kea } from 'kea'
import { Spin } from 'antd'
import { hot } from 'react-hot-loader/root'
import { PageHeader } from 'lib/components/PageHeader'
import { EventsTable } from 'scenes/events'

let actionLogic = kea({
    key: (props) => props.id || 'new',
    actions: () => ({
        checkIsFinished: (action) => ({ action }),
        setIsComplete: (isComplete) => ({ isComplete }),
    }),
    reducers: () => ({
        isComplete: [
            false,
            {
                setIsComplete: (_, { isComplete }) => isComplete,
            },
        ],
    }),
    loaders: ({ actions, props }) => ({
        action: {
            loadAction: async () => {
                actions.setIsComplete(false)
                let action = await api.get('api/action/' + props.id)
                actions.checkIsFinished(action)
                return action
            },
        },
    }),
    listeners: ({ actions, props }) => ({
        checkIsFinished: async ({ action }, breakpoint) => {
            breakpoint()
            if (action.is_calculating) {
                await breakpoint(1000)
                actions.loadAction()
            } else {
                props.onComplete()
                actions.setIsComplete(new Date())
            }
        },
    }),
    events: ({ actions, props }) => ({
        afterMount: async () => {
            if (props.id) {
                actions.loadAction()
            }
        },
    }),
})

function EditComponent(props) {
    return <ActionEdit {...props} />
}

export const Action = hot(_Action)
function _Action({ id }) {
    const fixedFilters = { action_id: id }

    const { push } = useActions(router)
    const { user } = useValues(userLogic)
    const { fetchEvents } = useActions(eventsTableLogic({ fixedFilters }))
    const { isComplete } = useValues(actionLogic({ id, onComplete: fetchEvents }))
    const { loadAction } = useActions(actionLogic({ id, onComplete: fetchEvents }))

    return (
        <div>
            <PageHeader title={id ? 'Editing action' : 'Creating action'} />

            <EditComponent
                apiURL=""
                actionId={id}
                user={user}
                onSave={(action) => {
                    if (!id) {
                        push(`/action/${action.id}`)
                    }
                    loadAction()
                }}
            />
            {id && !isComplete && (
                <div style={{ marginBottom: '10rem' }}>
                    <h2 className="subtitle">Events</h2>
                    <Spin style={{ marginRight: 12 }} />
                    Calculating action, please hold on.
                </div>
            )}
            {isComplete && (
                <div style={{ marginTop: 64 }}>
                    <EventsTable key={isComplete} fixedFilters={fixedFilters} filtersEnabled={false} />
                </div>
            )}
        </div>
    )
}
