export type StationObject = {
  icaoId: string;
  iataId: string;
  faaId: string;
  wmoId: number;
  lat: number;
  lon: number;
  elev: number;
  site: string;
  state: string;
  country: string;
  priority: number;
};

export type MetarObject = {
  metar_id: number;
  icaoId: string;
  receiptTime: string;
  obsTime: number;
  reportTime: string;
  temp: number | null;
  dewp: number | null;
  wdir: number | null;
  wspd: number | null;
  wgst: number | null;
  visib: number | null;
  altim: number | null;
  slp: number | null;
  qcField: number | null;
  wxString: string | null;
  presTend: string | null;
  maxT: number | null;
  minT: number | null;
  maxT24: number | null;
  minT24: number | null;
  precip: number | null;
  pcp3hr: number | null;
  pcp6hr: number | null;
  pcp24hr: number | null;
  snow: number | null;
  vertVis: string | null;
  metarType: "METAR" | "SPECI";
  rawOb: string;
  mostRecent: number;
  lat: number;
  lon: number;
  elev: number;
  prior: number;
  name: string;
  clouds: { cover: string; base: number }[] | null;
};

export type TafObject = {
  tafId: number | null;
  icaoId: string;
  dbPopTime: string;
  bulletinTime: string;
  issueTime: string;
  validTimeFrom: number | null;
  validTimeTo: number | null;
  rawTAF: string;
  mostRecent: number | null;
  remarks: string;
  lat: number | null;
  lon: number | null;
  elev: number | null;
  prior: number | null;
  name: string;
  fcsts: {
    timeGroup: number | null;
    timeFrom: number | null;
    timeTo: number | null;
    timeBec: number | null;
    fcstChange: string | null;
    probability: string | null;
    wdir: "VRB" | number | null;
    wspd: number | null;
    wgst: number | null;
    wshearHgt: number | null;
    wshearDir: number | null;
    wshearSpd: number | null;
    visib: "6+" | number | null;
    altim: number | null;
    vertVis: null;
    wxString: null;
    notDecoded: null;
    clouds: {
      cover: string | null;
      base: number | null;
      type: string | null;
    }[];
    icgTurb: {
      var: string | null;
      intensity: number | null;
      minAlt: number | null;
      maxAlt: number | null;
    }[];
    temp: {
      validTime: number | null;
      sfcTemp: number | null;
      maxOrMin: "MAX" | "MIN" | null;
    }[];
  }[];
};

export type HubDiscussion = {
  intLastChecked: number;
  CYVR: {
    strtext: string;
    strheaders: string;
    strdiscussion: string;
    stroutlook: string;
    strforecaster: string;
    stroffice: string;
    str3hrconfidence: string;
    int3hrconfidencecode: number;
    str6hrconfidence: string;
    int6hrconfidencecode: number;
    strvariability: string;
    intvariabilitycode: number;
    dtLastModified: number;
  };
  CYYC: {
    strtext: string;
    strheaders: string;
    strdiscussion: string;
    stroutlook: string;
    strforecaster: string;
    stroffice: string;
    str3hrconfidence: string;
    int3hrconfidencecode: number;
    str6hrconfidence: string;
    int6hrconfidencecode: number;
    strvariability: string;
    intvariabilitycode: number;
    dtLastModified: number;
  };
  CYYZ: {
    strtext: string;
    strheaders: string;
    strdiscussion: string;
    stroutlook: string;
    strforecaster: string;
    stroffice: string;
    str3hrconfidence: string;
    int3hrconfidencecode: number;
    str6hrconfidence: string;
    int6hrconfidencecode: number;
    strvariability: string;
    intvariabilitycode: number;
    dtLastModified: number;
  };
  CYUL: {
    strtext: string;
    strheaders: string;
    strdiscussion: string;
    stroutlook: string;
    strforecaster: string;
    stroffice: string;
    str3hrconfidence: string;
    int3hrconfidencecode: number;
    str6hrconfidence: string;
    int6hrconfidencecode: number;
    strvariability: string;
    intvariabilitycode: number;
    dtLastModified: number;
  };
};

export type NavCanResponse = {
  meta: {
    now: string;
    count: {
      image?: number;
      notam?: number;
    };
    messages: string[];
  };
  data: {
    type: string;
    pk: string;
    location: string;
    startValidity: string | null;
    endValidity: string | null;
    text: NavCanImageList | NavCanNOTAM;
    hasError: boolean;
    position: {
      pointReference: string;
      radialDistance: number;
    };
  }[];
};

export type NavCanImageList = {
  product: string;
  sub_product: string;
  geography: string;
  sub_geography: string;
  frame_lists: {
    id: number;
    sv: string | null;
    ev: string | null;
    frames: {
      id: number;
      sv: string | null;
      ev: string | null;
      images: {
        id: number;
        created: string;
      }[];
    }[];
  }[];
};

export type NavCanNOTAM = {
  raw: string;
  english: string | null;
  french: string | null;
};
