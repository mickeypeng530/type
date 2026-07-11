# 口述測資對稿(2026-07-11)

使用者用 iPhone 英文聽寫照唸,不唸編號、一句一換行、唸壞不修。
貼回的文字依順序與本稿對齊,差異 = 誤聽數據 → 收進 matcher.js 的 MISHEAR / PHRASE_MISHEAR,
整批進 eval.html(real:true)。B 組同時是 A3 智慧模式 findings 還原的 ground truth。

## A 組:選模板(1-30)
1. CT of brain without contrast → ct0b
2. CT of brain with and without contrast → ct2b
3. CTA of the brain → ct3b
4. Chest CT without contrast → ct0c
5. Chest CT with contrast → ct1c
6. CT of chest, abdomen and pelvis with and without contrast → ct2cap
7. Abdominal CT with and without contrast → ct2ap
8. Liver triphase CT → ct3l
9. CT urography → ctu/
10. CT of cervical spine without contrast → ct0cs
11. Chest X-ray → xc/ 或 xcpa1(歧義,偏好記憶)
12. Chest X-ray PA and lateral view → xcapl
13. KUB → xk/ 或 xk1/(與 ivp/ 歧義)
14. KUB and IVU → ivp/
15. Right knee X-ray → xrk
16. Left ankle X-ray → xlan
17. Both shoulders X-ray → xbsho
18. Cervical spine X-ray → xcs
19. Lumbar spine X-ray → xls
20. Skull X-ray → xs
21. Brain MRI without contrast → mr0br 群
22. Brain MRI with and without contrast → mr2br 群
23. MRI of lumbosacral spine → mr0ls
24. MRI of cervical spine → mr0cs
25. MRI of right shoulder → mrsho
26. MRI of left knee → mrkn
27. Esophagography → eso/ 或 tbe
28. Upper GI series → ugi1/
29. Small bowel series → sbs
30. Voiding cystourethrography → vcug

## B 組:帶 findings(31-44)
31. CT of brain without contrast, acute intracerebral hemorrhage at right basal ganglia → ct0b
32. CT of brain without contrast, chronic infarct at left MCA territory, no midline shift → ct0b
33. Chest X-ray, no active lung lesion → xc/ 群
34. Chest X-ray, patchy opacity at right lower lung field, suspect pneumonia → xc/ 群
35. Chest CT with contrast, a 1.2 cm nodule at left upper lobe, no mediastinal lymphadenopathy → ct1c
36. Abdominal CT with and without contrast, acute appendicitis with periappendiceal fat stranding → ct2ap
37. Liver triphase CT, a 3 cm HCC at segment 6 with washout → ct3l
38. Lumbar spine X-ray, compression fracture at L1, spondylolisthesis of L4 on L5 → xls
39. MRI of lumbosacral spine, L4-5 spinal canal stenosis, L5-S1 right neural foramen stenosis → mr0ls
40. MRI of cervical spine, C5-6 disc herniation with cord compression → mr0cs
41. Right knee X-ray, no fracture, mild degenerative change → xrk
42. KUB, a 0.8 cm stone at left lower ureter → xk/ 群
43. Brain MRI with and without contrast, an enhancing tumor at right frontal lobe about 2.5 cm with perifocal edema → mr2br 群
44. CT urography, left hydronephrosis and hydroureter → ctu/

## C 組:自由發揮(45-47)
不看稿,用自己的話講 2-3 句最近真的打過的報告開頭(對照組:自然講法 vs 稿子的差距)。

## 對稿結果(A組,2026-07-11)
28 句錄回(#8 liver triphase、#13 KUB 疑似沒錄到;"Neuro" 對位到 #9 urography 不確定)。
系統性誤聽已收進 matcher.js:CT→City、without→with our、with and without→with whistle、
contrast→contra/con contra、chest→Trust、MRI→Am I、brain→Perng/Prem/Brentwood、
spine→Spain/spy、shoulder→threshold、Upper GI→I'm a G.I.、VCUG→Avoiding system、
left ankle→Death and、abdominal↔abdomen(SYN)。
資訊全毀無法救(靠 pills/縮寫兜底):#3 CTA、#5 with contrast、#18 C-spine(→";")、
#20 skull、#21 Brain MRI(→Prince city,modality 消失)、#27 esophagography(→"Is")。
B 組(31-44)與 C 組(45-47)尚未錄。

## 已收到的真實口述(對稿前的第一批,2026-07-11)
- "City of brain without contrast" = CT of brain without contrast
- "Chest x-ray, no active down leg" = Chest x-ray, no active lung lesion
- "MRI of Nama spine L4, five spinal canal analysis mouth stenosis 05 S1 neural for diagnosis"
  = MRI of lumbar spine, L4/5 spinal canal stenosis, L5/S1 right neuroforamen stenosis(有漏字:right)
