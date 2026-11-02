// Countries for the shipping form (ISO 3166-1 alpha-2, named by the browser), and the
// states and provinces Lulu's couriers need for the US, Canada and Australia.

const CODES =
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW';

let names = null;
export const countries = () => {
  if (!names) {
    let display = null;
    try {
      display = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      /* very old browser: show codes */
    }
    names = CODES.split(' ')
      .map((code) => ({ code, name: (display && display.of(code)) || code }))
      .sort((a, b) => (a.code === 'US' ? -1 : b.code === 'US' ? 1 : a.name.localeCompare(b.name)));
  }
  return names;
};

const list = (s) => s.split(';').map((pair) => {
  const [code, name] = pair.split(':');
  return { code, name };
});

export const SUBDIVISIONS = {
  US: list(
    'AL:Alabama;AK:Alaska;AZ:Arizona;AR:Arkansas;CA:California;CO:Colorado;CT:Connecticut;DE:Delaware;DC:District of Columbia;FL:Florida;GA:Georgia;HI:Hawaii;ID:Idaho;IL:Illinois;IN:Indiana;IA:Iowa;KS:Kansas;KY:Kentucky;LA:Louisiana;ME:Maine;MD:Maryland;MA:Massachusetts;MI:Michigan;MN:Minnesota;MS:Mississippi;MO:Missouri;MT:Montana;NE:Nebraska;NV:Nevada;NH:New Hampshire;NJ:New Jersey;NM:New Mexico;NY:New York;NC:North Carolina;ND:North Dakota;OH:Ohio;OK:Oklahoma;OR:Oregon;PA:Pennsylvania;PR:Puerto Rico;RI:Rhode Island;SC:South Carolina;SD:South Dakota;TN:Tennessee;TX:Texas;UT:Utah;VT:Vermont;VA:Virginia;WA:Washington;WV:West Virginia;WI:Wisconsin;WY:Wyoming'
  ),
  CA: list(
    'AB:Alberta;BC:British Columbia;MB:Manitoba;NB:New Brunswick;NL:Newfoundland and Labrador;NS:Nova Scotia;NT:Northwest Territories;NU:Nunavut;ON:Ontario;PE:Prince Edward Island;QC:Quebec;SK:Saskatchewan;YT:Yukon'
  ),
  AU: list(
    'ACT:Australian Capital Territory;NSW:New South Wales;NT:Northern Territory;QLD:Queensland;SA:South Australia;TAS:Tasmania;VIC:Victoria;WA:Western Australia'
  ),
};
