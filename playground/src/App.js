import React from 'react';
import { instantiate } from "@mochi/dango";
import { ricecakes, flour } from 'mochi';
import { Grid, Code, Button, Select } from "@geist-ui/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { VscGithubInverted, VscDebugAlt } from "react-icons/vsc";
import useSWR from "swr";

import "./styles/App.css";
import { ReactComponent as Logo } from "./assets/mochi.svg";
import examples from "./lib/examples";

const wasmFetcher = async url => {
  const binary = await WebAssembly.compileStreaming(fetch(url));
  return await instantiate(binary);
};

const fetcher = url => fetch(url).then(r => r.json());

function useDango() {
  return useSWR("/dango.wasm", wasmFetcher);
}

function useColorScheme() {
  const { data } = useSWR("/theme.json", fetcher);
  const monaco = useMonaco();

  React.useEffect(() => {
    if (!!data && !!monaco) {
      monaco.editor.defineTheme('mochi', data);
      monaco.editor.setTheme('mochi');
    }
  }, [data, monaco]);
}

function App() {
  const exampleNames = Object.keys(examples);
  const defaultExample = exampleNames[0];

  const [buffer, setBuffer] = React.useState(examples[defaultExample]);
  const compiled = React.useMemo(() => {
    try {
      return ricecakes.compile(buffer);
    } catch (err) {
      return err.toString();
    }
  }, [buffer]);
  const disasm = React.useMemo(() => {
    try {
      return flour.disassemble(compiled);
    } catch (err) {
      return compiled;
    }
  }, [compiled]);

  const [output, setOutput] = React.useState("");

  const { data: vm } = useDango();

  const startExecution = async () => {
    if (!vm) { return; }
    if (compiled instanceof String) { return; }

    vm.initVM(flour.serialize(compiled));
    try {
      const result = vm.run();
      setOutput(`${vm.getConsole()}\nResult: ${result}`);
    } catch (err) {
      setOutput(err.toString());
    }
  }

  const onSelectChange = (v) => {
    const actual = v - 1;
    setBuffer(examples[exampleNames[actual]]);
  }

  useColorScheme();

  return (
    <div className="app">
      <nav className="navigation">
        <div className="navigation--container">
          <div className="navigation--left">
            <div className="navigation--logo">
              <Logo className="navigation--icon" />
              <span className="navigation--title">@mochi/playground</span>
            </div>
          </div>
          <div className="navigation--right">
            <Select onChange={onSelectChange} initialValue="1">
              {
                exampleNames.map((name, ix) =>
                  <Select.Option key={name} value={`${ix + 1}`}>{name}</Select.Option>
                )
              }
            </Select>
            <Button onClick={startExecution} iconRight={<VscDebugAlt />} auto scale={2 / 3} px={0.6} />
            <a rel="noreferrer" target="_blank" href="https://github.com/kosinw/mochi">
              <Button iconRight={<VscGithubInverted />} auto scale={2 / 3} px={0.6} />
            </a>
          </div>
        </div>
      </nav>
      <main className="main">
        <Grid.Container height="66%">
          <Grid style={{ height: "100%" }} xs={24} sm={12}>
            <Editor
              height="100%"
              defaultLanguage="scheme"
              options={{
                minimap: { enabled: false },
                tabSize: 2,
                "bracketPairColorization.enabled": true,
                fontSize: 11
              }}
              value={buffer}
              onChange={(v) => setBuffer(v)} />
          </Grid>
          <Grid height="100%" style={{ overflowY: "auto" }} xs={0} sm={12}>
            <div className="text-container">
              <Code padding={1} style={{ overflowY: "visible" }} font="10px" width="100%" height="100%" my={0} block>
                {disasm}
              </Code>
            </div>
          </Grid>
        </Grid.Container>
        <Code width="80%" style={{ overflowY: "auto" }} height="100%" my={0} block name="Output">
          {output}
        </Code>
      </main>
    </div >
  );
}

export default App;
