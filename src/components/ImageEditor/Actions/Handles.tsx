import React, { FC } from 'react';
import styled from 'styled-components';

const Handles: FC<{show: boolean | undefined}> = ({show}) => {
    return !show ? null : (<>
        {/* Corner Handles */}
        <StyledHandle className="handle left-handle top-handle"/>
        <StyledHandle className="handle left-handle bottom-handle"/>
        <StyledHandle className="handle right-handle top-handle"/>
        <StyledHandle className="handle right-handle bottom-handle"/>

        {/* Middle Handles */}
        <StyledHandle className="handle long-handle left-handle"/>
        <StyledHandle className="handle long-handle right-handle"/>
        <StyledHandle className="handle long-handle-horizontal top-handle"/>
        <StyledHandle className="handle long-handle-horizontal bottom-handle"/>
    </>);
}

export default Handles;

const StyledHandle = styled.div`
    &.showHandles .handle {
        display: block;
    }

    .handle {
        display: none;
        width: 10px !important;
        height: 10px !important;
        background: #fff;
        border-radius: 20px;
        border: 1px solid #ccc;
        position: absolute;
        box-shadow: 0 0 5px 1px rgb(57 76 96 / 15%), 0 0 0 1px rgb(53 71 90 / 20%);
    }

    .long-handle {
        height: 15px !important;
        width: 5px !important;
    }

    .long-handle-horizontal {
        height: 5px !important;
        width: 15px !important;
    }

    .right-handle.bottom-handle {
        transform: translate(-4px, -4px);
    }

    .right-handle.top-handle {
        transform: translate(-4px, 4px);
    }

    .left-handle.bottom-handle {
        transform: translate(4px, -4px);
    }

    .left-handle.top-handle {
        transform: translate(4px, 4px);
    }

    .long-handle-horizontal.bottom-handle,
    .long-handle-horizontal.top-handle {
        left: 50% !important;
        transform: translateX(-8px);
    }

    .long-handle.left-handle,
    .long-handle.right-handle {
        top: 50% !important;
        transform: translateY(-8px);
    }
`;