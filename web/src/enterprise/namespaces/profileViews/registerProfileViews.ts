import { Subscription, Unsubscribable } from 'rxjs'
import { ContributableViewContainer } from '../../../../../shared/src/api/protocol'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import H from 'history'
import { namespaceSavedSearches } from './namespaceSavedSearches'

export const registerProfileViews = ({
    extensionsController: { services },
    history,
}: ExtensionsControllerProps & { history: H.History }): Unsubscribable => {
    const subscription = new Subscription()

    subscription.add(
        services.view.register('profileView.savedSearches', ContributableViewContainer.Profile, context =>
            namespaceSavedSearches(context)
        )
    )

    return subscription
}
