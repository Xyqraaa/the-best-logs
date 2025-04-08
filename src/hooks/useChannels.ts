import { useContext, useEffect } from "react";
import { useQuery } from "react-query";
import { store } from "../store";

// Define the full State interface to match the global store state
interface State {
  apiBaseUrl: string;
  currentChannel: string | null;
  currentUsername: string | null;
  settings: {
    showEmotes: { displayName: string; value: boolean };
    showName: { displayName: string; value: boolean };
    showTimestamp: { displayName: string; value: boolean };
    twitchChatMode: { displayName: string; value: boolean };
    newOnBottom: { displayName: string; value: boolean };
  };
  error: boolean;
}

export interface Channel {
  userID: string;
  name: string;
}

export function useChannels(): Array<Channel> {
  const { state, setState } = useContext(store); // Access global state and setState function

  const { data, isLoading, isError } = useQuery<Array<Channel>>(`channels`, async () => {
    const zonianUrl = new URL(`https://logs.zonian.dev/channels`); // Request from new API
    const response = await fetch(zonianUrl.toString());

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const json = await response.json();

    return json.channels; // Return the fetched channels
  }, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Return the fetched channels
  return data ?? [];
}
