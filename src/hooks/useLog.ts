import { useContext } from "react";
import { useQuery } from "react-query";
import { getUserId, isUserId } from "../services/isUserId";
import { store } from "../store";
import { Emote, LogMessage, UserLogResponse } from "../types/log";
import runes from "runes";

export function useLog(channel: string, username: string, year: string, month: string): Array<LogMessage> {
    // console.log('useLog hook is running');  // Log to check if the hook is running

    const { state } = useContext(store);
    const urlParams = new URLSearchParams(window.location.search);
    const instanceUrl = urlParams.get('instance');
    // console.log('Extracted instance URL:', instanceUrl);

    const apiBaseUrl = instanceUrl || state.apiBaseUrl;
    // console.log('Using API base URL:', apiBaseUrl);

    const { data } = useQuery<Array<LogMessage>>(
        ["log", { channel, username, year, month }],
        () => {
            if (channel && username && apiBaseUrl) {
                console.log('Building query URL');  // Debug check

                const channelIsId = isUserId(channel);
                const usernameIsId = isUserId(username);

                if (channelIsId) {
                    channel = getUserId(channel);
                }
                if (usernameIsId) {
                    username = getUserId(username);
                }

                const queryUrl = new URL(`${apiBaseUrl}/channel${channelIsId ? "id" : ""}/${channel}/user${usernameIsId ? "id" : ""}/${username}/${year}/${month}`);
                queryUrl.searchParams.append("jsonBasic", "1");
                if (!state.settings.newOnBottom.value) {
                    queryUrl.searchParams.append("reverse", "1");
                }

                // console.log('Final query URL:', queryUrl.toString());  // Debug check

                return fetch(queryUrl.toString())
                    .then((response) => {
                        // console.log('API Response:', response);
                        if (response.ok) {
                            return response;
                        }
                        throw Error(response.statusText);
                    })
                    .then((response) => response.json())
                    .then((data: UserLogResponse) => {
                        console.log('Fetched logs data:', data);
                        const messages: Array<LogMessage> = [];
                        for (const msg of data.messages) {
                            messages.push({
                                ...msg,
                                timestamp: new Date(msg.timestamp),
                                emotes: parseEmotes(msg.text, msg.tags["emotes"]),
                            });
                        }

                        return messages;
                    })
                    .catch((error) => {
                        // console.error('Error during fetch:', error);
                        return [];
                    });
            }

            // console.error('Channel or username or API base URL is missing.');
            return [];
        },
        { refetchOnWindowFocus: false, refetchOnReconnect: false }
    );

    return data ?? [];
}


function parseEmotes(messageText: string, emotes: string | undefined): Array<Emote> {
    const parsed: Array<Emote> = [];
    if (!emotes) {
        return parsed;
    }

    const groups = emotes.split("/");

    for (const group of groups) {
        const [id, positions] = group.split(":");
        const positionGroups = positions.split(",");

        for (const positionGroup of positionGroups) {
            const [startPos, endPos] = positionGroup.split("-");

            const startIndex = Number(startPos);
            const endIndex = Number(endPos) + 1;

            parsed.push({
                id,
                startIndex: startIndex,
                endIndex: endIndex,
                code: runes.substr(messageText, startIndex, endIndex - startIndex + 1),
            });
        }
    }

    return parsed;
}
