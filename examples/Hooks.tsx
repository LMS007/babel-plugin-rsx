import { useEffect, useState, useMemo, useCallback } from "react" 

export interface Article {
  _id: string;
  name: string;
  authorId: string;
  properties?: {};
  dateCreated: string;
  hidden: boolean;
  assets: Record<string, Asset>;
  headerImageId: string;
  title: string;
  publishDate: string;
  version: number;
  contentType: 'article';
  authorDetails: AuthorDetails;
}

export interface System {
  _id: string;
  name: string;
  authorId: string;
  properties: SystemProperties;
  dateCreated: string;
  hidden: boolean;
  assets: Record<string, Asset>;
  headerImageId: string;
  title: string;
  publishDate: string;
  version: number;
  contentType: 'system';
  authorDetails: AuthorDetails;
}

export interface Driver {
  _id: string;
  name: string;
  authorId: string;
  properties: DriverProperties;
  dateCreated: string;
  hidden: boolean;
  assets: Record<string, Asset>;
  headerImageId: string;
  title: string;
  publishDate: string;
  version: number;
  contentType: 'driver';
  authorDetails: AuthorDetails;
}

export interface AuthorDetails {
  _id: string;
  name: string;
}

export interface Asset {
  fileId: string;
  fileName: string;
  originalName: string;
}

export interface SystemProperties {
  manufactureId: string;
  yearBuilt: number;
  cost: number;
  tsp: Tsp;
  complex: Complex;
  physProperties: PhysProperties;
  manufactureDetails: ManufactureDetails;
  systemType: SystemType
  ampliferInternal: boolean,
  customBuilt: boolean,
  driverId: string
  driverQty: number;
  amplifierId: string
}

export interface DriverProperties {
  manufactureId: string;
  yearBuilt: number;
  coilProperties: CoilProperties;
  generalProperties: GeneralProperties;
  tsp: Tsp;
  complex: Complex;
  physProperties: PhysProperties;
  manufactureDetails: ManufactureDetails;
}

export interface PhysProperties {
  weight: number,
  height:  number,
  width:  number,
  depth:  number,
}
export interface CoilProperties {
  coilType: CoilType;
  windType: string;
  wireType: string;
  coilDiam: number;
  windingWidth: number;
  layers: number;
}

export interface GeneralProperties {
  weight: number;
  xmax: number;
  nominalSize: number;
  spiderDiam: number;
  gapHeight: number;
}

export interface Tsp {
  mms: number;
  bl: number;
  le: number;
  sd: number;
  cms: number;
  res: number;
  qms: number;
}

export interface Complex {
  re: number;
  leb: number;
  le: number;
  rss: number;
  ke: number;
}

export interface PhysProperties {
  diameter: number;
  cutout: number;
  boltDiam: number;
  mountingDepth: number;
}

export interface ManufactureDetails {
  _id: string;
  name: string;
  website: string;
  assets: Record<string, Asset>;
  dateCreated: string;
}

export enum CoilType {
  Overhung = "Overhung",
  Underhung = "Underhung",
  Split = "Split",
  DifferentialDrive = "Differential Drive",
  LMS = "LMS",
  XBL2 = "XBL2",
}
export enum SystemType {
  Ported = 'Ported',
  Sealed = 'Seated',
  Passive = 'Passive Radiator',
  Bandpass4 = 'Bandpass 4th Order',
  Bandpass6 = 'Bandpass 6th Order',
  FL_Horn = 'Front Loaded Horn',
  TappedHorn = 'Tapped Horn',
  BandpassHorn = 'Bandpass Horn',
  Open = 'Open Baffle'
}



export type HomePageContentItem = System | Driver  | Article;

const usePaginatedFetch = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HomePageContentItem[]>([])
  const [hasNext, setHasNext] = useState(true)
  const [nextCursor, setNextCursor] = useState()

  // return the useCall back to be called from the useEffect in the parent, otherwise
  // if we just call fetchDaa inside this hook, it will be called twice in dev mode
  // because we can't prevent the double call here. Instead we can use a ref for init state
  // and call it once when the parent component loads.
  const fetchData = useCallback(async (cursor: string|undefined, size: number)=>{
    setLoading(true);
    const result = await fetch(`/api/home?lastPublishDate=${cursor}&pageSize=${size}`);
    const nextItems = await result.json();
    setHasNext(nextItems.hasMore);
    setNextCursor(nextItems.nextCursor);
    setData(prev=>([...prev, ...nextItems.content]));
    setLoading(false);
  }, [])

  return {fetchData, loading, data, hasNext, nextCursor}
}

export {
  usePaginatedFetch
}



// #4

export function useFetch(url: string) {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /*useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then((r)=>{setData(r)});
  }, [url]);*/

  async function fetchData() {
      setLoading(true)
    }

  useEffect(() => {
    fetchData();
  }, [url])

  return { data, loading };
}

