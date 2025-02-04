import { type Activity } from 'botframework-directlinejs';

import DirectToEngineServerSentEventsChatAdapterAPI from './private/DirectToEngineServerSentEventsChatAdapterAPI';
import { type HalfDuplexChatAdapterAPI } from './private/types/HalfDuplexChatAdapterAPI';
import { type Strategy } from './types/Strategy';

type ExecuteTurnFunction = (activity: Activity) => TurnGenerator;

type CreateHalfDuplexChatAdapterInit = {
  emitStartConversationEvent?: boolean;
  locale?: string;
  retry?:
    | Readonly<{
        factor?: number | undefined;
        minTimeout?: number | undefined;
        maxTimeout?: number | undefined;
        randomize?: boolean | undefined;
        retries?: number | undefined;
      }>
    | undefined;
  telemetry?: { trackException(exception: unknown, customProperties?: Record<string, unknown>): void };
};

type TurnGenerator = AsyncGenerator<Activity, ExecuteTurnFunction, undefined>;

const createExecuteTurn = (api: HalfDuplexChatAdapterAPI): ExecuteTurnFunction => {
  let obsoleted = false;

  return (activity: Activity): TurnGenerator => {
    if (obsoleted) {
      throw new Error('This executeTurn() function is obsoleted. Please use a new one.');
    }

    obsoleted = true;

    const activities = api.executeTurn(activity);

    return (async function* () {
      yield* activities;

      return createExecuteTurn(api);
    })();
  };
};

export default function createHalfDuplexChatAdapter(
  strategy: Strategy,
  init: CreateHalfDuplexChatAdapterInit = {}
): TurnGenerator {
  return (async function* (): TurnGenerator {
    const api = new DirectToEngineServerSentEventsChatAdapterAPI(strategy, {
      retry: init.retry,
      telemetry: init.telemetry
    });

    const activities = api.startNewConversation({
      emitStartConversationEvent: init.emitStartConversationEvent ?? true,
      locale: init.locale
    });

    yield* activities;

    return createExecuteTurn(api);
  })();
}

export type { CreateHalfDuplexChatAdapterInit, ExecuteTurnFunction, TurnGenerator };
