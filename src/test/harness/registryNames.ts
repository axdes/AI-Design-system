import registry from '../../../component-registry.json'

/* Every name the registry publishes, entries and their parts alike: a card
 * family or a form kind is built from `CardTitle` and `WizardReview` as much as
 * from `Card` and `WizardTemplate`, and both rule files are held to naming only
 * things that exist. Shared, because two test files asking the same question of
 * the same file twice is how the two answers drift apart. */
export const REGISTRY_NAMES = new Set(
  Object.values({ ...registry.components, ...registry.blocks }).flatMap((e) => [
    (e as { ref: string }).ref,
    ...((e as { exports?: string[] }).exports ?? []),
  ]),
)
