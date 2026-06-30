#!/usr/bin/env node
// iakalog — publie un message de conversation sur MQTT (iakaboxlogs).
// ZERO DEPENDANCE : MQTT 3.1.1 sur TCP en Node pur (QoS 0, fire-and-forget).
// Le pont persiste le message dans CouchDB (base "conversations"), vu dans Fauxton.
//
// Usage :
//   node iakalog.mjs --role <user|assistant|system> --content "..." \
//        [--conv <id>] [--royaume <r>] [--agent <a>] [--tokens N] \
//        [--meta '<json>'] [--canal <valeur>] [--id <_id>]
//
//   --meta  : JSON arbitraire pour le champ meta (def {} ; rétro-compatible). JSON
//             invalide -> retombe sur {} (message stderr, pas de crash).
//   --canal : raccourci pour meta.canal (fusionné après --meta).
//   --id    : _id déterministe transporté dans le payload (le bridge l'honore s'il existe).
//
// Config par variables d'env (aucun secret en dur) :
//   IAKALOG_MQTT_URL (def mqtt://192.168.2.11:1883), IAKALOG_USER, IAKALOG_PASS,
//   IAKALOG_ROYAUME, IAKALOG_AGENT, IAKALOG_CONV, IAKALOG_PREFIX (def "iakaboxlogs")
import net from 'node:net'

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def
}
const fail = (m) => { console.error('iakalog:', m); process.exit(1) }

const URL = process.env.IAKALOG_MQTT_URL || 'mqtt://192.168.2.11:1883'
const USER = process.env.IAKALOG_USER
const PASS = process.env.IAKALOG_PASS
const prefix = process.env.IAKALOG_PREFIX || 'iakaboxlogs'
const royaume = arg('royaume', process.env.IAKALOG_ROYAUME || 'unknown')
const agent = arg('agent', process.env.IAKALOG_AGENT || 'unknown')
const conv = arg('conv', process.env.IAKALOG_CONV || 'default')
const role = arg('role')
const content = arg('content')
const tokens = parseInt(arg('tokens', '0'), 10) || 0

// --meta '<json>' (def {}) ; rétro-compatible. JSON invalide -> {} sans crash.
let meta = {}
const metaRaw = arg('meta')
if (metaRaw) {
  try {
    const parsed = JSON.parse(metaRaw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = parsed
    else console.error('iakalog: --meta ignoré (pas un objet JSON), meta={}')
  } catch { console.error('iakalog: --meta ignoré (JSON invalide), meta={}') }
}
const canal = arg('canal')
if (canal) meta.canal = canal
const docId = arg('id')

const u = URL.match(/^mqtt:\/\/([^:/]+)(?::(\d+))?/)
if (!u) fail('IAKALOG_MQTT_URL invalide (attendu mqtt://host:port)')
if (!USER || !PASS) fail('IAKALOG_USER / IAKALOG_PASS manquants')
if (!role || !content) fail('--role et --content sont requis')
const host = u[1], port = parseInt(u[2] || '1883', 10)

const topic = `${prefix}/${royaume}/${agent}/${conv}`
const doc = { role, content, ts: new Date().toISOString(), tokens, meta }
if (docId) doc._id = docId
const payload = JSON.stringify(doc)

// --- encodage MQTT 3.1.1 ---
const remLen = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 0x80; o.push(d) } while (n > 0); return Buffer.from(o) }
const mstr = (s) => { const b = Buffer.from(s, 'utf8'); return Buffer.concat([Buffer.from([b.length >> 8, b.length & 0xff]), b]) }
const connectPkt = () => {
  const rest = Buffer.concat([mstr('MQTT'), Buffer.from([4, 0xC2, 0, 30]), mstr('iakalog-' + process.pid), mstr(USER), mstr(PASS)])
  return Buffer.concat([Buffer.from([0x10]), remLen(rest.length), rest])
}
const publishPkt = () => {
  const body = Buffer.concat([mstr(topic), Buffer.from(payload, 'utf8')])
  return Buffer.concat([Buffer.from([0x30]), remLen(body.length), body])
}

const sock = net.connect({ host, port })
const timer = setTimeout(() => { sock.destroy(); fail('timeout de connexion au broker') }, 7000)
let connacked = false
sock.on('connect', () => sock.write(connectPkt()))
sock.on('data', (d) => {
  if (connacked || d[0] !== 0x20) return            // attendre CONNACK
  connacked = true
  if (d[3] !== 0) { clearTimeout(timer); sock.destroy(); return fail('connexion refusee par le broker (code ' + d[3] + ')') }
  sock.write(publishPkt(), () => { clearTimeout(timer); console.log('iakalog: publie sur ' + topic); sock.end() })
})
sock.on('error', (e) => { clearTimeout(timer); fail(e.message) })
sock.on('close', () => { if (connacked) process.exit(0) })
