# Volwasse assistent: ontwikkelingsplan

Status: beplanning, nie produksiegereed nie. Die bestaande app bly onaangeraak; hierdie tak is slegs vir ontwikkeling. Die toepassing word vir volwassenes van 18 jaar en ouer ontwerp. ’n Ouderdomsverklaring alleen bewys nie dat kinders nie toegang sal hê nie; ontwerp, beskrywing, toegang en diensvoorwaardes moet by die werklike gebruik pas.

## Doel
Bou ’n verbeterde persoonlike assistent met natuurlike, meertalige gesprekke en ’n bruikbare geskiedenis. Behou toepaslike funksies van die bestaande app, maar pas hulle vir volwassenes aan: stem en luister, stories of inhoud skep, speletjies, teken, notas, instellings en bedtyd- of fokusbeheer. Maak duidelik watter funksies werklik werk en watter afgeskakel is.

## Aksies en gesprek
- Ontwerp gesprekke met duidelike konteks, gebruikersbeheer oor onthou en uitvee, en toeganklike Afrikaans en Engels.
- Voeg aksies stapsgewys by met werklike, gemagtigde diensintegrasies. Toestemming, toegang, status en foute moet sigbaar wees. Noem nooit ’n aksie voltooi sonder bevestiging van die diens nie.
- Vra bevestiging voor boodskappe gestuur, besprekings gemaak, aankope gedoen, lêers gedeel of data uitgevee word. Slegs vooraf uitdruklik toegelate outomatisering mag sonder herhaalde bevestiging loop, met ’n manier om dit te stop.
- Sluit veilige foutafhandeling, per-gebruiker toegang, beperkende toestemmings, rate limiting, ouditspore sonder onnodige inhoud, en beskerming teen prompt injection in.

## WhatsApp
- Stel vas of die gebruiker ’n besigheidsnommer met WhatsApp Business Platform, of ’n ander gemagtigde ondersteunde integrasie nodig het. Moenie persoonlike WhatsApp-toegang belowe voordat die beskikbare en toegelate metode bevestig is nie.
- Skakel nie die bestaande onveilige WhatsApp-demo of gedeelde mediakluis weer aan nie. Vir ’n besigheidsintegrasie: verifieer identiteit en toestemming, gebruik veilig geverifieerde webhooks, beskerm sleutels bedienerkant en beperk toegang per gebruiker.
- Volg Meta se toepaslike beleid, insluitend die 24-uur-venster, goedgekeurde templates waar nodig en ’n geskikte menslike eskalasiepad vir outomatisering. Bevestig registrasie, koste en geskiktheid voor implementering.

## Veiligheid en publikasie
- Verwyder die bestaande verstek-PIN en ontwerp migrasie vir bestaande gebruikers; ’n plaaslike PIN is nie rekeningsekuriteit nie.
- Beplan veilige verifikasie, privaat databerging, beperkings op toegang en versoeke, privaatheidskennisgewing, toestemming en verwydering. Skuif alle geheime en private stem-ID’s na bedienerkant-konfigurasie.
- Kontroleer die gekose KI-verskaffer se gebruiks- en databepalings vir die werklike volwasse app en toets kwaliteit en veiligheid in albei tale.
- Bou, voer tipe- en gedragstoetse uit, toets die mobiele uitleg, toegangbeheer, data-isolasie en eksterne integrasies. Publiseer nie voordat veiligheidskwessies opgelos en die dienskonfigurasie en koste bevestig is nie.
- Behou die ou app totdat die nuwe weergawe getoets en data-oordrag of uitvoer afgehandel is. Moenie die ou repo of diens outomaties uitvee nie.
