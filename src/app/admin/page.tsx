'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import styles from './admin.module.css';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  /admin — content editor for non-coders.
 *
 *  Loads content.json through the API, renders a form generated from its
 *  structure, and saves it back (password-protected). On a host with a
 *  writable filesystem the file is written directly; on Vercel the API
 *  commits to GitHub instead, which triggers an automatic redeploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type JsonValue = string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type PathSegment = string | number;

/** French labels for every known content key. Unknown keys fall back to raw. */
const LABELS: Record<string, string> = {
  identity: 'Identité',
  name: 'Nom affiché',
  fullName: 'Nom complet',
  role: 'Rôle (sous le nom)',
  headline: 'Titre principal de la page',
  intro: "Texte d'introduction",
  email: 'E-mail',
  github: 'Lien GitHub',
  cvHref: 'Fichier CV (chemin ou URL)',
  siteUrl: 'URL du site en ligne',
  redshiftEpochStart: "Début de l'échelle redshift (AAAA-MM-JJ)",
  milestones: 'Jalons du voyage cosmique (4 galaxies)',
  title: 'Titre',
  shortTitle: 'Titre court',
  date: 'Date de début (AAAA-MM-JJ)',
  dateLabel: 'Dates affichées',
  description: 'Description',
  href: 'Lien (laisser vide si aucun)',
  papers: 'Articles (Papers)',
  authors: 'Auteurs',
  venue: 'Revue / conférence',
  year: 'Année',
  abstract: 'Résumé',
  links: 'Liens',
  label: 'Libellé',
  featured: 'Mis en avant (encadré « Featured »)',
  posters: 'Posters',
  event: 'Événement',
  slides: 'Présentations (Slides)',
  reports: 'Rapports',
  context: 'Contexte',
  about: 'À propos',
  position: 'Poste actuel',
  bio: 'Biographie (un paragraphe par ligne)',
  interests: 'Intérêts de recherche (un par ligne)',
  skills: 'Compétences (une par ligne)',
  externalLinks: 'Liens externes (Scholar, ORCID…)',
  id: 'Identifiant technique (unique, sans espace)',
};

const TEXTAREA_KEYS = new Set(['intro', 'description', 'abstract']);
/** Link fields that get a "Téléverser…" button (PDF de poster, CV, etc.). */
const UPLOAD_KEYS = new Set(['href', 'cvHref']);
const UPLOAD_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.svg';
/** Sections whose item count is locked (the 3D journey has exactly 4 stages). */
const FIXED_LENGTH_KEYS = new Set(['milestones']);
const SECTION_ORDER = [
  'identity',
  'redshiftEpochStart',
  'milestones',
  'papers',
  'posters',
  'slides',
  'reports',
  'about',
  'externalLinks',
];

function labelFor(key: string): string {
  return LABELS[key] ?? key;
}

function isStringArray(value: JsonValue[]): value is string[] {
  return value.every((item) => typeof item === 'string');
}

function setAtPath(root: JsonObject, path: PathSegment[], value: JsonValue): void {
  let node: JsonValue = root;
  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i];
    if (Array.isArray(node) && typeof segment === 'number') {
      node = node[segment];
    } else if (typeof node === 'object' && node !== null && !Array.isArray(node) && typeof segment === 'string') {
      node = node[segment];
    } else {
      return;
    }
  }
  const last = path[path.length - 1];
  if (Array.isArray(node) && typeof last === 'number') {
    node[last] = value;
  } else if (typeof node === 'object' && node !== null && !Array.isArray(node) && typeof last === 'string') {
    node[last] = value;
  }
}

function getAtPath(root: JsonObject, path: PathSegment[]): JsonValue | undefined {
  let node: JsonValue = root;
  for (const segment of path) {
    if (Array.isArray(node) && typeof segment === 'number') {
      node = node[segment];
    } else if (typeof node === 'object' && node !== null && !Array.isArray(node) && typeof segment === 'string') {
      node = node[segment];
    } else {
      return undefined;
    }
  }
  return node;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; message: string }
  | { kind: 'error'; message: string };

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [content, setContent] = useState<JsonObject | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    const stored = window.sessionStorage.getItem('admin-password');
    if (stored) {
      setPassword(stored);
      void verifyPassword(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    fetch('/api/content')
      .then((response) => response.json())
      .then((data: JsonObject) => setContent(data))
      .catch(() => setStatus({ kind: 'error', message: 'Impossible de charger le contenu.' }));
  }, [unlocked]);

  async function verifyPassword(candidate: string): Promise<void> {
    setGateError(null);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': candidate },
        body: JSON.stringify({ verify: true }),
      });
      if (response.ok) {
        window.sessionStorage.setItem('admin-password', candidate);
        setUnlocked(true);
      } else {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setGateError(data.error ?? 'Mot de passe refusé.');
        window.sessionStorage.removeItem('admin-password');
      }
    } catch {
      setGateError('Serveur injoignable.');
    }
  }

  const update = useCallback((path: PathSegment[], value: JsonValue) => {
    setContent((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      setAtPath(next, path, value);
      return next;
    });
  }, []);

  const addItem = useCallback((path: PathSegment[]) => {
    setContent((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      const array = getAtPath(next, path);
      if (Array.isArray(array) && array.length > 0) {
        const template = structuredClone(array[array.length - 1]);
        if (typeof template === 'object' && template !== null && !Array.isArray(template)) {
          const record = template as JsonObject;
          if (typeof record.id === 'string') {
            record.id = `${record.id}-copie-${array.length + 1}`;
          }
        }
        array.push(template);
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((path: PathSegment[], index: number) => {
    setContent((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      const array = getAtPath(next, path);
      if (Array.isArray(array) && array.length > 1) {
        array.splice(index, 1);
      }
      return next;
    });
  }, []);

  async function save(): Promise<void> {
    if (!content) return;
    setStatus({ kind: 'saving' });
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(content),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (response.ok) {
        setStatus({ kind: 'saved', message: data.message ?? 'Enregistré.' });
      } else {
        setStatus({ kind: 'error', message: data.error ?? `Erreur ${response.status}.` });
      }
    } catch {
      setStatus({ kind: 'error', message: 'Serveur injoignable.' });
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    setStatus({ kind: 'saving' });
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ name: file.name, data }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        path?: string;
        message?: string;
        error?: string;
      };
      if (response.ok && json.path) {
        setStatus({ kind: 'saved', message: json.message ?? 'Fichier téléversé.' });
        return json.path;
      }
      setStatus({ kind: 'error', message: json.error ?? 'Téléversement impossible.' });
      return null;
    } catch {
      setStatus({ kind: 'error', message: 'Téléversement impossible.' });
      return null;
    }
  }

  function download(): void {
    if (!content) return;
    const blob = new Blob([`${JSON.stringify(content, null, 2)}\n`], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'content.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function onGateSubmit(event: FormEvent): void {
    event.preventDefault();
    void verifyPassword(password);
  }

  if (!unlocked) {
    return (
      <div className={styles.gate}>
        <form className={styles.gateCard} onSubmit={onGateSubmit}>
          <h1 className={styles.title}>Édition du site</h1>
          <p className={styles.subtitle}>
            Entrez le mot de passe administrateur pour modifier les textes du site.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            aria-label="Mot de passe administrateur"
            autoFocus
          />
          {gateError ? <p className={styles.statusError}>{gateError}</p> : null}
          <button type="submit" className={styles.saveButton}>
            Ouvrir l&apos;éditeur
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Édition du site</h1>
        <p className={styles.subtitle}>
          Modifiez les textes ci-dessous puis cliquez sur « Enregistrer ». Aucune connaissance en
          code n&apos;est nécessaire — la mise en page et les animations ne changent pas.
        </p>
      </header>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.saveButton}
          onClick={() => void save()}
          disabled={status.kind === 'saving' || !content}
        >
          {status.kind === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className={styles.ghostButton} onClick={download}>
          Télécharger le JSON
        </button>
        <a className={styles.ghostButton} href="/" target="_blank" rel="noopener noreferrer">
          Voir le site
        </a>
        {status.kind === 'saved' ? (
          <span className={`${styles.status} ${styles.statusOk}`}>{status.message}</span>
        ) : null}
        {status.kind === 'error' ? (
          <span className={`${styles.status} ${styles.statusError}`}>{status.message}</span>
        ) : null}
      </div>

      {content ? (
        SECTION_ORDER.filter((key) => key in content).map((key) => (
          <details key={key} className={styles.panel} open={key === 'identity'}>
            <summary>{labelFor(key)}</summary>
            <div className={styles.panelBody}>
              <ValueEditor
                keyName={key}
                value={content[key]}
                path={[key]}
                update={update}
                addItem={addItem}
                removeItem={removeItem}
                upload={uploadFile}
              />
            </div>
          </details>
        ))
      ) : (
        <p className={styles.status}>Chargement du contenu…</p>
      )}
    </div>
  );
}

type EditorProps = {
  keyName: string;
  value: JsonValue;
  path: PathSegment[];
  update: (path: PathSegment[], value: JsonValue) => void;
  addItem: (path: PathSegment[]) => void;
  removeItem: (path: PathSegment[], index: number) => void;
  upload: (file: File) => Promise<string | null>;
};

function ValueEditor({
  keyName,
  value,
  path,
  update,
  addItem,
  removeItem,
  upload,
}: EditorProps): ReactNode {
  if (typeof value === 'string') {
    // Link fields accept either a pasted URL or an uploaded file (poster PDF,
    // CV…) — the upload fills the field with the file's public path.
    if (UPLOAD_KEYS.has(keyName)) {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{labelFor(keyName)}</span>
          <div className={styles.fileRow}>
            <input
              type="text"
              value={value}
              onChange={(event) => update(path, event.target.value)}
              placeholder="URL ou fichier téléversé"
              aria-label={labelFor(keyName)}
            />
            <label className={styles.uploadButton}>
              Téléverser…
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  void upload(file).then((publicPath) => {
                    if (publicPath) update(path, publicPath);
                  });
                }}
              />
            </label>
          </div>
        </div>
      );
    }

    const multiline = TEXTAREA_KEYS.has(keyName) || value.length > 90;
    return (
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labelFor(keyName)}</span>
        {multiline ? (
          <textarea value={value} onChange={(event) => update(path, event.target.value)} />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => update(path, event.target.value)}
          />
        )}
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{labelFor(keyName)}</span>
        <input
          type="number"
          value={value}
          onChange={(event) => update(path, Number(event.target.value) || 0)}
        />
      </label>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => update(path, event.target.checked)}
        />
        {labelFor(keyName)}
      </label>
    );
  }

  if (Array.isArray(value)) {
    if (isStringArray(value)) {
      return (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labelFor(keyName)}</span>
          <textarea
            value={value.join('\n')}
            onChange={(event) => update(path, event.target.value.split('\n'))}
          />
        </label>
      );
    }

    const fixedLength = FIXED_LENGTH_KEYS.has(keyName);
    return (
      <>
        {fixedLength ? (
          <p className={styles.hint}>
            Le voyage 3D comporte exactement {value.length} étapes — leurs textes sont modifiables,
            mais on ne peut pas en ajouter ni en retirer.
          </p>
        ) : null}
        {value.map((item, index) => (
          <div className={styles.itemCard} key={`${path.join('.')}-${index}`}>
            <div className={styles.itemHead}>
              <span className={styles.itemTitle}>
                {labelFor(keyName)} — {String(index + 1).padStart(2, '0')}
              </span>
              {!fixedLength && value.length > 1 ? (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeItem(path, index)}
                >
                  Supprimer
                </button>
              ) : null}
            </div>
            <ValueEditor
              keyName={keyName}
              value={item}
              path={[...path, index]}
              update={update}
              addItem={addItem}
              removeItem={removeItem}
              upload={upload}
            />
          </div>
        ))}
        {!fixedLength ? (
          <button type="button" className={styles.addButton} onClick={() => addItem(path)}>
            + Ajouter un élément
          </button>
        ) : null}
      </>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className={styles.nested}>
        {Object.entries(value).map(([childKey, childValue]) => (
          <ValueEditor
            key={childKey}
            keyName={childKey}
            value={childValue}
            path={[...path, childKey]}
            update={update}
            addItem={addItem}
            removeItem={removeItem}
            upload={upload}
          />
        ))}
      </div>
    );
  }

  return null;
}
