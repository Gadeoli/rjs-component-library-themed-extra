import React from "react";
import App4Test from "../src/components/Test/App4Test";
// import GlobalStyle from "../src/components/GlobalStyle"

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    }
  },
  decorators: [
    (Story) => {
      return (<App4Test>
        {/* Cant use global style in sb => generate a not found body error */}
        {/* <GlobalStyle />  */}
        <Story />
      </App4Test>);
    },
  ]
}

export default preview;