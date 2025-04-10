import { Button, TextField } from "@mui/material";
import { Autocomplete } from '@mui/material';
import React, { FormEvent, useContext } from "react";
import { useQueryClient } from "react-query";
import styled from "styled-components";
import { useChannels } from "../hooks/useChannels";
import { store } from "../store";
import { Settings } from "./Settings";

const FiltersContainer = styled.form`
    display: inline-flex;
    align-items: center;
    padding: 15px;
    background: var(--bg-bright);
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    margin: 0 auto;
    z-index: 99;

    > * {
        margin-right: 15px !important;    

        &:last-child {
            margin-right: 0 !important;
        }
    }
`;

const FiltersWrapper = styled.div`
    text-align: center;
`;

export function Filters() {
    const { setCurrents, state } = useContext(store);
    const queryClient = useQueryClient();
    const channels = useChannels();

    // Get the instance parameter from the URL and decode it if present.
    const urlParams = new URLSearchParams(window.location.search);
    const instanceParam = urlParams.get("instance");
    const defaultInstance = instanceParam ? decodeURIComponent(instanceParam) : "";

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (e.target instanceof HTMLFormElement) {
            const data = new FormData(e.target);

            const channel = data.get("channel") as string | null;
            const username = data.get("username") as string | null;

            queryClient.invalidateQueries(["log", { channel: channel?.toLowerCase(), username: username?.toLowerCase() }]);
            setCurrents(channel, username);
        }
    };

    return <FiltersWrapper>
        <FiltersContainer onSubmit={handleSubmit} action="none">
            <img src="/POGGIES-2x.webp" alt='' width="70" height="64"/>
            <Autocomplete
                id="autocomplete-channels"
                options={channels.map(channel => channel.name)}
                style={{ width: 225 }}
                defaultValue={state.currentChannel}
                getOptionLabel={(channel: string) => channel}
                clearOnBlur={false}
                renderInput={(params) => <TextField {...params} name="channel" label="channel or id:123" variant="filled" autoFocus={state.currentChannel === null} />}
            />
            <TextField 
                error={state.error} 
                name="username" 
                label="username or id:123" 
                variant="filled" 
                autoComplete="off" 
                defaultValue={state.currentUsername} 
                autoFocus={state.currentChannel !== null && state.currentUsername === null} 
            />
            <Button variant="contained" color="primary" size="large" type="submit">load</Button>
            <Settings />
        </FiltersContainer>
        {defaultInstance && (
            <div style={{ marginTop: "10px", color: "white", padding: "5px"}}>
                Using instance: <a href={defaultInstance} target="_blank" rel="noopener noreferrer">{defaultInstance}</a> | This website is using the <a href="https://logs.zonian.dev/" target="_blank" rel="noopener noreferrer">best-logs</a> API.
            </div>
        )}
    </FiltersWrapper>
}