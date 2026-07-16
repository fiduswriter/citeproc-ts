import { CSL } from '../csl';
export const ParticleList = (function () {
    const always_dropping_1 = [[[0, 1], null]];
    const always_dropping_3 = [[[0, 3], null]];
    const always_non_dropping_1 = [[null, [0, 1]]];
    const always_non_dropping_2 = [[null, [0, 2]]];
    const always_non_dropping_3 = [[null, [0, 3]]];
    const either_1 = [[null, [0, 1]], [[0, 1], null]];
    const either_2 = [[null, [0, 2]], [[0, 2], null]];
    const either_1_dropping_best = [[[0, 1], null], [null, [0, 1]]];
    const either_2_dropping_best = [[[0, 2], null], [null, [0, 2]]];
    const either_3_dropping_best = [[[0, 3], null], [null, [0, 3]]];
    const non_dropping_2_alt_dropping_1_non_dropping_1 = [[null, [0, 2]], [[0, 1], [1, 2]]];
    const PARTICLES = [
        ["'s", always_non_dropping_1],
        ["'s-", always_non_dropping_1],
        ["'t", always_non_dropping_1],
        ["a", always_non_dropping_1],
        ["aan 't", always_non_dropping_2],
        ["aan de", always_non_dropping_2],
        ["aan den", always_non_dropping_2],
        ["aan der", always_non_dropping_2],
        ["aan het", always_non_dropping_2],
        ["aan t", always_non_dropping_2],
        ["aan", always_non_dropping_1],
        ["ad-", either_1],
        ["adh-", either_1],
        ["af", either_1],
        ["al", either_1],
        ["al-", either_1],
        ["am de", always_non_dropping_2],
        ["am", always_non_dropping_1],
        ["an-", either_1],
        ["ar-", either_1],
        ["as-", either_1],
        ["ash-", either_1],
        ["at-", either_1],
        ["ath-", either_1],
        ["auf dem", either_2_dropping_best],
        ["auf den", either_2_dropping_best],
        ["auf der", either_2_dropping_best],
        ["auf ter", always_non_dropping_2],
        ["auf", either_1_dropping_best],
        ["aus 'm", either_2_dropping_best],
        ["aus dem", either_2_dropping_best],
        ["aus den", either_2_dropping_best],
        ["aus der", either_2_dropping_best],
        ["aus m", either_2_dropping_best],
        ["aus", either_1_dropping_best],
        ["aus'm", either_2_dropping_best],
        ["az-", either_1],
        ["aš-", either_1],
        ["aḍ-", either_1],
        ["aḏ-", either_1],
        ["aṣ-", either_1],
        ["aṭ-", either_1],
        ["aṯ-", either_1],
        ["aẓ-", either_1],
        ["ben", always_non_dropping_1],
        ["bij 't", always_non_dropping_2],
        ["bij de", always_non_dropping_2],
        ["bij den", always_non_dropping_2],
        ["bij het", always_non_dropping_2],
        ["bij t", always_non_dropping_2],
        ["bij", always_non_dropping_1],
        ["bin", always_non_dropping_1],
        ["boven d", always_non_dropping_2],
        ["boven d'", always_non_dropping_2],
        ["d", always_non_dropping_1],
        ["d'", either_1],
        ["da", either_1],
        ["dal", always_non_dropping_1],
        ["dal'", always_non_dropping_1],
        ["dall'", always_non_dropping_1],
        ["dalla", always_non_dropping_1],
        ["das", either_1],
        ["de die le", always_non_dropping_3],
        ["de die", always_non_dropping_2],
        ["de l", always_non_dropping_2],
        ["de l'", always_non_dropping_2],
        ["de la", non_dropping_2_alt_dropping_1_non_dropping_1],
        ["de las", non_dropping_2_alt_dropping_1_non_dropping_1],
        ["de le", always_non_dropping_2],
        ["de li", either_2],
        ["de van der", always_non_dropping_3],
        ["de", either_1],
        ["de'", either_1],
        ["deca", always_non_dropping_1],
        ["degli", either_1],
        ["dei", either_1],
        ["del", either_1],
        ["dela", always_dropping_1],
        ["dell'", either_1],
        ["della", either_1],
        ["delle", either_1],
        ["dello", either_1],
        ["den", either_1],
        ["der", either_1],
        ["des", either_1],
        ["di", either_1],
        ["die le", always_non_dropping_2],
        ["do", always_non_dropping_1],
        ["don", always_non_dropping_1],
        ["dos", either_1],
        ["du", either_1],
        ["ed-", either_1],
        ["edh-", either_1],
        ["el", either_1],
        ["el-", either_1],
        ["en-", either_1],
        ["er-", either_1],
        ["es-", either_1],
        ["esh-", either_1],
        ["et-", either_1],
        ["eth-", either_1],
        ["ez-", either_1],
        ["eš-", either_1],
        ["eḍ-", either_1],
        ["eḏ-", either_1],
        ["eṣ-", either_1],
        ["eṭ-", either_1],
        ["eṯ-", either_1],
        ["eẓ-", either_1],
        ["het", always_non_dropping_1],
        ["i", always_non_dropping_1],
        ["il", always_dropping_1],
        ["im", always_non_dropping_1],
        ["in 't", always_non_dropping_2],
        ["in de", always_non_dropping_2],
        ["in den", always_non_dropping_2],
        ["in der", either_2],
        ["in het", always_non_dropping_2],
        ["in t", always_non_dropping_2],
        ["in", always_non_dropping_1],
        ["l", always_non_dropping_1],
        ["l'", always_non_dropping_1],
        ["la", always_non_dropping_1],
        ["las", always_non_dropping_1],
        ["le", always_non_dropping_1],
        ["les", either_1],
        ["lo", either_1],
        ["los", always_non_dropping_1],
        ["lou", always_non_dropping_1],
        ["of", always_non_dropping_1],
        ["onder 't", always_non_dropping_2],
        ["onder de", always_non_dropping_2],
        ["onder den", always_non_dropping_2],
        ["onder het", always_non_dropping_2],
        ["onder t", always_non_dropping_2],
        ["onder", always_non_dropping_1],
        ["op 't", always_non_dropping_2],
        ["op de", either_2],
        ["op den", always_non_dropping_2],
        ["op der", always_non_dropping_2],
        ["op gen", always_non_dropping_2],
        ["op het", always_non_dropping_2],
        ["op t", always_non_dropping_2],
        ["op ten", always_non_dropping_2],
        ["op", always_non_dropping_1],
        ["over 't", always_non_dropping_2],
        ["over de", always_non_dropping_2],
        ["over den", always_non_dropping_2],
        ["over het", always_non_dropping_2],
        ["over t", always_non_dropping_2],
        ["over", always_non_dropping_1],
        ["s", always_non_dropping_1],
        ["s'", always_non_dropping_1],
        ["sen", always_dropping_1],
        ["t", always_non_dropping_1],
        ["te", always_non_dropping_1],
        ["ten", always_non_dropping_1],
        ["ter", always_non_dropping_1],
        ["tho", always_non_dropping_1],
        ["thoe", always_non_dropping_1],
        ["thor", always_non_dropping_1],
        ["to", always_non_dropping_1],
        ["toe", always_non_dropping_1],
        ["tot", always_non_dropping_1],
        ["uijt 't", always_non_dropping_2],
        ["uijt de", always_non_dropping_2],
        ["uijt den", always_non_dropping_2],
        ["uijt te de", always_non_dropping_3],
        ["uijt ten", always_non_dropping_2],
        ["uijt", always_non_dropping_1],
        ["uit 't", always_non_dropping_2],
        ["uit de", always_non_dropping_2],
        ["uit den", always_non_dropping_2],
        ["uit het", always_non_dropping_2],
        ["uit t", always_non_dropping_2],
        ["uit te de", always_non_dropping_3],
        ["uit ten", always_non_dropping_2],
        ["uit", always_non_dropping_1],
        ["unter", always_non_dropping_1],
        ["v", always_non_dropping_1],
        ["v.", always_non_dropping_1],
        ["v.d.", always_non_dropping_1],
        ["van 't", always_non_dropping_2],
        ["van de l", always_non_dropping_3],
        ["van de l'", always_non_dropping_3],
        ["van de", always_non_dropping_2],
        ["van de", always_non_dropping_2],
        ["van den", always_non_dropping_2],
        ["van der", always_non_dropping_2],
        ["van gen", always_non_dropping_2],
        ["van het", always_non_dropping_2],
        ["van la", always_non_dropping_2],
        ["van t", always_non_dropping_2],
        ["van ter", always_non_dropping_2],
        ["van van de", always_non_dropping_3],
        ["van", either_1],
        ["vander", always_non_dropping_1],
        ["vd", always_non_dropping_1],
        ["ver", always_non_dropping_1],
        ["vom und zum", always_dropping_3],
        ["vom", either_1],
        ["von 't", always_non_dropping_2],
        ["von dem", either_2_dropping_best],
        ["von den", either_2_dropping_best],
        ["von der", either_2_dropping_best],
        ["von t", always_non_dropping_2],
        ["von und zu", either_3_dropping_best],
        ["von zu", either_2_dropping_best],
        ["von", either_1_dropping_best],
        ["voor 't", always_non_dropping_2],
        ["voor de", always_non_dropping_2],
        ["voor den", always_non_dropping_2],
        ["voor in 't", always_non_dropping_3],
        ["voor in t", always_non_dropping_3],
        ["voor", always_non_dropping_1],
        ["vor der", either_2_dropping_best],
        ["vor", either_1_dropping_best],
        ["z", always_dropping_1],
        ["ze", always_dropping_1],
        ["zu", either_1_dropping_best],
        ["zum", either_1],
        ["zur", either_1]
    ];
    return PARTICLES;
}());

export const parseParticles = (function () {
    function splitParticles(nameValue: any, firstNameFlag?: any, caseOverride?: any): any {
        let origNameValue = nameValue;
        nameValue = caseOverride ? nameValue.toLowerCase() : nameValue;
        const particleList: any[] = [];
        let rex: any;
        let hasParticle: any;
        if (firstNameFlag) {
            nameValue = nameValue.split("").reverse().join("");
            rex = CSL.PARTICLE_GIVEN_REGEXP;
        } else {
            rex = CSL.PARTICLE_FAMILY_REGEXP;
        }
        let m = nameValue.match(rex);
        while (m) {
            const m1 = firstNameFlag ? m[1].split("").reverse().join("") : m[1];
            let firstChar = m ? m1 : false;
            firstChar = firstChar ? m1.replace(/^[-\'\u02bb\u2019\s]*(.).*$/, "$1") : false;
            hasParticle = firstChar ? firstChar.toUpperCase() !== firstChar : false;
            if (!hasParticle) {
                break;
            }
            if (firstNameFlag) {
                particleList.push(origNameValue.slice(m1.length * -1));
                origNameValue = origNameValue.slice(0, m1.length * -1);
            } else {
                particleList.push(origNameValue.slice(0, m1.length));
                origNameValue = origNameValue.slice(m1.length);
            }
            nameValue = m[2];
            m = nameValue.match(rex);
        }
        if (firstNameFlag) {
            nameValue = nameValue.split("").reverse().join("");
            particleList.reverse();
            for (let i = 1, ilen = particleList.length; i < ilen; i += 1) {
                if (particleList[i].slice(0, 1) == " ") {
                    particleList[i - 1] += " ";
                }
            }
            for (let i2 = 0, ilen2 = particleList.length; i2 < ilen2; i2 += 1) {
                if (particleList[i2].slice(0, 1) == " ") {
                    particleList[i2] = particleList[i2].slice(1);
                }
            }
            nameValue = origNameValue.slice(0, nameValue.length);
        } else {
            nameValue = origNameValue.slice(nameValue.length * -1);
        }
        return [hasParticle, nameValue, particleList];
    }
    function trimLast(str: any): any {
        const lastChar = str.slice(-1);
        str = str.trim();
        if (lastChar === " " && ["\'", "\u2019"].indexOf(str.slice(-1)) > -1) {
            str += " ";
        }
        return str;
    }
    function parseSuffix(nameObj: any): void {
        if (!nameObj.suffix && nameObj.given) {
            let m = nameObj.given.match(/(\s*,!*\s*)/);
            if (m) {
                const idx = nameObj.given.indexOf(m[1]);
                const possible_suffix = nameObj.given.slice(idx + m[1].length);
                const possible_comma = nameObj.given.slice(idx, idx + m[1].length).replace(/\s*/g, "");
                if (possible_suffix.replace(/\./g, "") === "et al" && !nameObj["dropping-particle"]) {
                    nameObj["dropping-particle"] = possible_suffix;
                    nameObj["comma-dropping-particle"] = ",";
                } else {
                    if (possible_comma.length === 2) {
                        nameObj["comma-suffix"] = true;
                    }
                    nameObj.suffix = possible_suffix;
                }
                nameObj.given = nameObj.given.slice(0, idx);
            }
        }
    }
    return function (nameObj: any): void {
        const res = splitParticles(nameObj.family);
        const lastNameValue = res[1];
        const lastParticleList = res[2];
        nameObj.family = lastNameValue;
        const nonDroppingParticle = trimLast(lastParticleList.join(""));
        if (nonDroppingParticle) {
            nameObj["non-dropping-particle"] = nonDroppingParticle;
        }
        parseSuffix(nameObj);
        const res2 = splitParticles(nameObj.given, true);
        const firstNameValue = res2[1];
        const firstParticleList = res2[2];
        nameObj.given = firstNameValue;
        const droppingParticle = firstParticleList.join("").trim();
        if (droppingParticle) {
            nameObj["dropping-particle"] = droppingParticle;
        }
    };
}());
