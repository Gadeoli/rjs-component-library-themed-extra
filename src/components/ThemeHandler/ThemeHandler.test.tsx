import React from "react";
import { render } from "@testing-library/react"

import ThemeHandler from "./ThemeHandler";

const compName = "ThemeHandler"

describe(compName, () => {
    test(`Renders the ${compName} component`, () => {
        render(<ThemeHandler>
            <>abc</>
        </ThemeHandler>);
    })
})