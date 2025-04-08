import { Button } from "@mui/material";
import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import { Txt } from "../icons/Txt";
import { getUserId, isUserId } from "../services/isUserId";
import { store } from "../store";
import { ContentLog } from "./ContentLog";
import { TwitchChatContentLog } from "./TwitchChatLogContainer";

const LogContainer = styled.div`
    position: relative;
    background: var(--bg-bright);
    border-radius: 3px;
    padding: 0.5rem;
    margin-top: 3rem;

    .txt {
        position: absolute;
        top: 5px;
        right: 15px;
        opacity: 0.9;
        cursor: pointer;
        z-index: 999;

        &:hover {
            opacity: 1;
        }
    }
`;

export function Log({ year, month, initialLoad = false }: { year: string, month: string, initialLoad?: boolean }) {
    const { state } = useContext(store);
    const [load, setLoad] = useState(initialLoad);
    const [txtHref, setTxtHref] = useState("");

    useEffect(() => {
        if (state.apiBaseUrl) {
            // Start building the base URL for txtHref
            let url = `${state.apiBaseUrl}`;
            if (state.currentChannel && isUserId(state.currentChannel)) {
                url += `/channelid/${getUserId(state.currentChannel)}`;
            } else {
                url += `/channel/${state.currentChannel}`;
            }

            if (state.currentUsername && isUserId(state.currentUsername)) {
                url += `/userid/${getUserId(state.currentUsername)}`;
            } else {
                url += `/user/${state.currentUsername}`;
            }

            // Append the year and month
            url += `/${year}/${month}?reverse`;

            // Check if there's an 'instance' URL in the query parameters
            const urlParams = new URLSearchParams(window.location.search);
            const instanceEncoded = urlParams.get('instance');
            if (instanceEncoded) {
                // Decode the URL and replace localhost with logs.potat.app
                let instanceUrl = decodeURIComponent(instanceEncoded);

                // Make sure the instance URL is properly formatted with /channel/username/year/month?reverse
                instanceUrl += `/channel/${state.currentChannel}/user/${state.currentUsername}/${year}/${month}?reverse`;

                // Now, set the txtHref to the updated instance URL
                setTxtHref(instanceUrl);
            } else {
                // If no instance URL is found, use the constructed URL
                setTxtHref(url);
            }
        }
    }, [state.apiBaseUrl, state.currentChannel, state.currentUsername, year, month]);

    if (!load) {
        return <LogContainer>
            <LoadableLog year={year} month={month} onLoad={() => setLoad(true)} />
        </LogContainer>
    }

    return <LogContainer>
        <a className="txt" target="__blank" href={txtHref} rel="noopener noreferrer"><Txt /></a>
        {!state.settings.twitchChatMode.value && <ContentLog year={year} month={month} />}
        {state.settings.twitchChatMode.value && <TwitchChatContentLog year={year} month={month} />}
    </LogContainer>
}

const LoadableLogContainer = styled.div`

`;

function LoadableLog({ year, month, onLoad }: { year: string, month: string, onLoad: () => void }) {
    return <LoadableLogContainer>
        <Button variant="contained" color="primary" size="large" onClick={onLoad}>load {year}/{month}</Button>
    </LoadableLogContainer>
}
