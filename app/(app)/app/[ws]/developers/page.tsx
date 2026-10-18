import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/app/Blocks";
import { getWorkspace } from "@/lib/app/workspaces";

export const metadata = { title: "Developers" };

// Every snippet below is the engine's real interface, checked against ../mitra:
// lib/sdk/client.ts (MitraClient, agents.register), app/api/v1/vaults/sync/route.ts
// (card sync, owner-signed) and scripts/mitra-mcp.ts (MITRA_API_URL).

const REGISTER = `// The SDK ships inside the engine repo (lib/sdk). There is no npm package yet.
import { MitraClient } from "../mitra/lib/sdk";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount(process.env.AGENT_KEY as \`0x\${string}\`);

const mitra = new MitraClient({
  baseUrl: "https://mitra-engine.fly.dev",   // the engine's API root
  agentId: "agent_research",
  chainId: 84532,                     // Base Sepolia; Tempo Moderato is 42431
  signer: { address: wallet.address, signTypedData: (t) => wallet.signTypedData(t) },
});

// Proves the agent controls this wallet, by signing the registration.
await mitra.agents.register({
  name: "Research agent",
  owner: "acme",
  capabilities: ["data_indexing"],
  chain: "base",
});`;

const SYNC = `POST /api/v1/vaults/sync      (the app sends this for you)
{
  "card": { "chain": "base", "principal": "<your wallet>", "holder": "<agent wallet>",
            "agentId": "agent_research_…", "capabilities": ["payment", "research"],
            "counterparties": ["*"], "issuedAt": 1791900000 },
  "auth": { "signer": "<your wallet>", "chainId": 84532, "signature": "0x…" }
}`;

const CONNECT = `{
  "mcpServers": {
    "mitra": {
      "command": "node",
      "args": ["/path/to/mitra/bin/mitra-mcp.mjs"],
      "env": { "MITRA_API_URL": "https://mitra-engine.fly.dev" }
    }
  }
}`;

export default async function Developers({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();

  return (
    <>
      <PageHead
        title="Developers"
        sub="Agents never use this app. They talk to Mitra through the SDK, the API or MCP. These are the agent-side steps to get one working."
      />
      {w.demo ? null : (
        <p className="lv-note">
          The app already did the on-chain part from your wallet: the vault and each agent’s limits in the vault contract (
          <Link href={`/app/${w.slug}/agents`}>Agents</Link>). What follows runs on the agent’s side and against the engine.
        </p>
      )}
      <p className="ap-sub" style={{ marginTop: -12 }}>
        Everything here runs against the hosted engine on test networks, <code className="mono">https://mitra-engine.fly.dev</code>
        (MCP for agents on port 8443, with its token). To run your own, <code className="mono">npm run stack:up</code> in the engine
        repo: the API on 3005, MCP on 3006.
      </p>

      <section id="register" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 1</span>
          <h2>Register with the engine</h2>
          <p>
            The agent tells the engine who it is, signed by the same wallet you registered on the Agents page, so nobody can
            register an agent they don’t control.
          </p>
          <p>
            <Link href="/docs/quickstart">Quickstart in the docs →</Link>
          </p>
        </div>
        <pre className="ap-code">{REGISTER}</pre>
      </section>

      <section id="limits" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 2</span>
          <h2>Sync the card with the engine</h2>
          <p>
            Nothing to run. On the <Link href={`/app/${w.slug}/agents`}>Agents</Link> page, press <b>Sync with Mitra</b> on the
            agent&rsquo;s card. Your wallet signs a message (no gas); the engine checks the signature, reads the budget, cap and end
            date from the vault contract itself, and takes only the capabilities from you. No operator token is involved.
          </p>
          <p>
            <Link href="/docs/engravings-and-mandates">How limits work →</Link>
          </p>
        </div>
        <pre className="ap-code">{SYNC}</pre>
      </section>

      <section id="connect" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 3</span>
          <h2>Connect it</h2>
          <p>
            Add Mitra to the agent’s MCP config, or use the SDK directly. The MCP server holds no keys and no money: every tool is
            a call to the API, and every payment still passes the three checks.
          </p>
          <p>
            <Link href="/docs/mcp-gateway">MCP gateway in the docs →</Link>
          </p>
        </div>
        <pre className="ap-code">{CONNECT}</pre>
      </section>
    </>
  );
}
