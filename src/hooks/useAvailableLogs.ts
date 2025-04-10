import { useContext } from "react";
import { useQuery } from "react-query";
import { OptOutError } from "../errors/OptOutError";
import { getUserId, isUserId } from "../services/isUserId";
import { store } from "../store";

export type AvailableLogs = Array<{ month: string, year: string }>;

// Fix the type inference by providing the exact return type for the useQuery hook
export function useAvailableLogs(channel: string | null, username: string | null): [AvailableLogs, Error | undefined] {
    const { state, setState } = useContext(store);

    // Explicitly type the return of useQuery to match the desired output
    const { data, error } = useQuery<AvailableLogs, Error | null>(
        ["availableLogs", { channel, username }],
        async () => {
            if (!channel || !username) {
                return [];  // Return an empty array if channel or username is missing
            }

            const channelIsId = isUserId(channel);
            const usernameIsId = isUserId(username);

            if (channelIsId) {
                channel = getUserId(channel);
            }
            if (usernameIsId) {
                username = getUserId(username);
            }

            const queryUrl = new URL(`https://logs.zonian.dev/api/${channel}/${usernameIsId ? 'id:' : ''}${username}`);

            try {
                const response = await fetch(queryUrl.toString());

                if (!response.ok) {
                    setState({ ...state, error: true });
                    
                    if (response.status === 403) {
                        throw new OptOutError();
                    }

                    throw Error(response.statusText);
                }

                const responseData = await response.json();
                
                // Debugging: Log the structure of responseData to see its exact shape
                // console.log("responseData:", responseData);

                // Handle the response based on the available structure
                const availableLogs = responseData.availableLogs || responseData.loggedData?.list || [];

                // Filter logs to get only unique year-month combinations
                const uniqueLogs = availableLogs.reduce((acc: AvailableLogs, log: { year: string, month: string, day: string }) => {
                    const exists = acc.some((entry) => entry.year === log.year && entry.month === log.month);
                    if (!exists) {
                        acc.push({ year: log.year, month: log.month });
                    }
                    return acc;
                }, []); 

                if (responseData?.userLogs?.instances) {
                    const firstUserInstance = responseData.userLogs.instances[0];

                    // Debugging: Log firstUserInstance to see its value
                    // console.log("firstUserInstance:", firstUserInstance);

                    if (firstUserInstance) {
                        let newApiBaseUrl = firstUserInstance?.url || firstUserInstance; // Directly use firstUserInstance if it's already a URL

                        if (newApiBaseUrl) {
                            // Add the 'instance=link' parameter to the browser's URL
                            const url = new URL(window.location.href);  // Get the current URL of the page
                            url.searchParams.set('instance', newApiBaseUrl);  // Add 'instance' with the value of the URL

                            // Update the browser's URL without reloading the page
                            window.history.pushState({}, "", url.toString());

                            // console.log("Updated browser URL with 'instance' parameter:", url.toString());

                            // Optionally store it in the state if needed
                            setState({
                                ...state,
                                apiBaseUrl: url.toString(),  // Save updated URL in state (optional)
                            });
                        } else {
                            // Simplified error message: only show the missing URL in the log
                            // console.error("URL is missing in firstUserInstance:", firstUserInstance);
                        }
                    } else {
                        // console.error("First user instance is not available:", firstUserInstance);
                    }
                }

                return uniqueLogs || [];  // Return unique logs, ignoring the day field

            } catch (err) {
                // console.error("An error occurred while fetching available logs:", err);
                return [];  // Return an empty array on error
            }
        },
        { refetchOnWindowFocus: false, refetchOnReconnect: false }
    );

    // Explicit fallback to ensure the return type is always `[AvailableLogs, Error | undefined]`
    return [data || [], error ?? undefined];  // If error is null, convert it to undefined
}
