import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  documentIdFor,
  type CourseDocumentEnrollment,
  type CourseDocumentKind,
  type CourseDocumentStatus,
  type CourseDocumentValues,
  type DocumentActivityType,
  type StoredCourseDocument,
} from '@/lib/course-documents';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.courseDocuments';

type CourseDocumentRow = {
  id: string;
  participant_id: string;
  participant_name: string;
  purchase_id: string;
  product_id: string;
  activity_type?: DocumentActivityType;
  kind: CourseDocumentKind;
  title: string;
  status: CourseDocumentStatus;
  parent_name: string;
  course_place: string;
  payload: CourseDocumentValues;
  signed_at_text: string | null;
  updated_at_text: string;
};

type SaveCourseDocumentInput = {
  enrollment: CourseDocumentEnrollment;
  kind: CourseDocumentKind;
  title: string;
  status: CourseDocumentStatus;
  values: CourseDocumentValues;
};

let cached: StoredCourseDocument[] | null = null;
const listeners = new Set<(documents: StoredCourseDocument[]) => void>();

function emit(documents: StoredCourseDocument[]) {
  cached = documents;
  for (const listener of listeners) listener(documents);
}

function parseDocuments(value: string | null): StoredCourseDocument[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
        .filter((item): item is StoredCourseDocument => typeof item?.id === 'string')
        .map((item) => ({ ...item, activityType: item.activityType ?? inferActivityType(item.productId, item.purchaseId) }))
      : [];
  } catch {
    return [];
  }
}

function inferActivityType(productId: string, purchaseId: string): DocumentActivityType {
  return productId.startsWith('camp-') || purchaseId.startsWith('camp-') ? 'Tábor' : 'Kroužek';
}

function documentFromRow(row: CourseDocumentRow): StoredCourseDocument {
  return {
    id: row.id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    activityType: row.activity_type ?? inferActivityType(row.product_id, row.purchase_id),
    kind: row.kind,
    title: row.title,
    status: row.status,
    parentName: row.parent_name,
    coursePlace: row.course_place,
    values: row.payload ?? {},
    signedAt: row.signed_at_text ?? undefined,
    updatedAt: row.updated_at_text,
  };
}

function rowFromDocument(document: StoredCourseDocument): CourseDocumentRow {
  return {
    id: document.id,
    participant_id: document.participantId,
    participant_name: document.participantName,
    purchase_id: document.purchaseId,
    product_id: document.productId,
    activity_type: document.activityType,
    kind: document.kind,
    title: document.title,
    status: document.status,
    parent_name: document.parentName,
    course_place: document.coursePlace,
    payload: document.values,
    signed_at_text: document.signedAt ?? null,
    updated_at_text: document.updatedAt,
  };
}

async function loadLocalDocuments() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return parseDocuments(value);
  } catch {
    return [];
  }
}

async function saveLocalDocuments(documents: StoredCourseDocument[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch {
    // ignore storage failures in the prototype
  }
}

export async function loadCourseDocuments() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('course_documents')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      const documents = (data as CourseDocumentRow[]).map(documentFromRow);
      cached = documents;
      return documents;
    }
  }

  const documents = await loadLocalDocuments();
  cached = documents;
  return documents;
}

export async function saveCourseDocument(input: SaveCourseDocumentInput) {
  const current = cached ?? await loadCourseDocuments();
  const now = new Date();
  const signedAt = input.status === 'signed' ? now.toLocaleDateString('cs-CZ') : undefined;
  const document: StoredCourseDocument = {
    id: documentIdFor(input.enrollment, input.kind),
    participantId: input.enrollment.participantId,
    participantName: input.enrollment.participantName,
    purchaseId: input.enrollment.purchaseId,
    productId: input.enrollment.productId,
    activityType: input.enrollment.activityType,
    kind: input.kind,
    title: input.title,
    status: input.status,
    parentName: String(input.values.parentName ?? ''),
    coursePlace: input.enrollment.place,
    values: input.values,
    signedAt,
    updatedAt: now.toLocaleString('cs-CZ'),
  };
  const next = [document, ...current.filter((item) => item.id !== document.id)];

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('course_documents').upsert(rowFromDocument(document), { onConflict: 'id' });

    if (error) await saveLocalDocuments(next);
  } else {
    await saveLocalDocuments(next);
  }

  emit(next);
  return document;
}

export function useCourseDocuments() {
  const [documents, setDocuments] = useState<StoredCourseDocument[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadCourseDocuments().then((loadedDocuments) => {
        if (!mounted) return;
        setDocuments(loadedDocuments);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextDocuments: StoredCourseDocument[]) => setDocuments(nextDocuments);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { documents, ready, saveCourseDocument };
}