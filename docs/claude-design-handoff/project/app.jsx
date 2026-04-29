// App composition + routing
const { useState, useEffect } = React;

function App() {
  const [route, setRoute] = useState("signals");
  const [selectedSignal, setSelectedSignal] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "g") {
        const next = (ev) => {
          const m = { s: "signals", r: "runs", c: "campaigns", k: "knowledge", a: "arch", l: "audit" };
          if (m[ev.key]) setRoute(m[ev.key]);
          window.removeEventListener("keydown", next);
        };
        window.addEventListener("keydown", next, { once: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar route={route} setRoute={setRoute}/>
      <Topbar route={route} signal={selectedSignal}/>
      <main className="app__main">
        <div className="main">
          {route === "signals" && <SignalsScreen setRoute={setRoute} setSelectedSignal={setSelectedSignal}/>}
          {route === "runs" && <RunScreen signal={selectedSignal}/>}
          {route === "campaigns" && <CampaignsScreen/>}
          {route === "arch" && <ArchScreen/>}
          {route === "audit" && <AuditScreen/>}
          {route === "knowledge" && <KnowledgeScreen/>}
          <Footer/>
        </div>
      </main>
      <MobileTabbar route={route} setRoute={setRoute}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
