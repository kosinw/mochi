import React from 'react';
import { instantiate } from "@mochi/dango";
import { ricecakes, flour } from 'mochi';
import useSWR from "swr";

const fetcher = async url => {
  const binary = await WebAssembly.compileStreaming(fetch(url));
  return await instantiate(binary);
};

function useDango() {
  return useSWR("./dango.wasm", fetcher);
}

function App() {
  const { data: vm, error } = useDango();
  const [disassembly, setDisassembly] = React.useState("");
  const [source, setSource] = React.useState("");

  const onButtonClick = () => {
    const compiled = ricecakes.compile(source);
    setDisassembly(flour.disassemble(compiled));
    const object = flour.serialize(compiled);
    vm.initVM(object);
    console.log(vm.run());
  };

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: "column",
      alignItems: "center"
    }}>
      <p>joe biden's ripe and juicy nutsack</p>
      <textarea style={{ width: 400, height: 400 }} value={source} onChange={(e) => setSource(e.target.value)} />
      <button onClick={onButtonClick}>Compile</button>
      <code style={{ whiteSpace: 'pre', textAlign: 'left' }}>
        {disassembly}
      </code>
    </div>
  );
}

export default App;
