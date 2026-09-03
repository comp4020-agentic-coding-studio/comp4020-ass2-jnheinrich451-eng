export const readings = {
  "chong-forsyth-2020": {
    authors: "Chong, M. J. and Forsyth, D.",
    title: "Effectively Unbiased FID and Inception Score and Where to Find Them",
    venue: "CVPR",
    year: 2020,
    url: "https://openaccess.thecvf.com/content_CVPR_2020/papers/Chong_Effectively_Unbiased_FID_and_Inception_Score_and_Where_to_Find_CVPR_2020_paper.pdf",
    verified: "2026-09-02",
  },
  "heusel-2017": {
    authors: "Heusel, M. et al.",
    title: "GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium",
    venue: "NIPS",
    year: 2017,
    url: "https://papers.nips.cc/paper_files/paper/2017/file/8a1d694707eb0fefe65871369074926d-Paper.pdf",
    verified: "2026-09-03",
  },
  "binkowski-2018": {
    authors: "Binkowski, M. et al.",
    title: "Demystifying MMD GANs",
    venue: "ICLR",
    year: 2018,
    url: "https://openreview.net/pdf?id=r1lUOzWCW",
    verified: "2026-09-03",
  },
} as const;

export type ReadingKey = keyof typeof readings;