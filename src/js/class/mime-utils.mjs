export class MIMEUtils {
    static levenshteinDistance(a, b, context) {

        if (b.indexOf(a) !== -1) return 0;

        const distances = [];

        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        for (let i = 0; i <= b.length; i++) {
            distances[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            distances[0][j] = j;
        }

        let sequences = []; 
        
        if(context === "item") {
            sequences = [
                "Potion", "Wizard", "Boots", "of", "Shield", "Hat", "Ring", "Helmet", "Rune", "Platebody",
                "(Perfect)", "Skillcape", "Slayer", "Platelegs", "Amulet", "D-hide", "Body", "Gloves", "Ancient"
            ];
        } else if(context === "monster") {
            sequences = ["Monster", "Spider", "of", "Dragon", "the", "Ice", "Golem", "Knight", "Giant", "The",
                "Fire", "Turkul", "Eye", "Guardian", "Wizard", "Spirit", "Goo", "Horned", "Elite", "Guard", "Miolite",
                "Cursed", "Greater", "Phase", "Herald"
            ]
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                // If the characters at the current positions in the two strings are the same,
                // the distance is the same as the distance between the two substrings without those characters
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    distances[i][j] = distances[i - 1][j - 1];
                } 
                else {
                    // Otherwise, the distance is the minimum of the three possible operations (insertion, deletion, substitution)
                    // plus the cost of that operation
                    distances[i][j] = Math.min(
                        // insertion
                        sequences.includes(b.substring(i - 1, i + 2)) ? distances[i - 1][j] + 0.5 : distances[i - 1][j] + 1,
                        // deletion
                        sequences.includes(a.substring(j - 1, j + 2)) ? distances[i][j - 1] + 0.5 : distances[i][j - 1] + 1,
                        // substitution
                        b.charCodeAt(i - 1) - a.charCodeAt(j - 1) === 1 || b.charCodeAt(i - 1) - a.charCodeAt(j - 1) === -1
                        ? distances[i - 1][j - 1] + 0.5
                        : distances[i - 1][j - 1] + 1 
                    );

                    if (i > 1 && j > 1 && b.charAt(i - 1) === a.charAt(j - 2) && b.charAt(i - 2) === a.charAt(j - 1)) {
                        distances[i][j] = Math.min(
                            distances[i][j],
                            distances[i - 2][j - 2] + 0.5 // transposition
                        );
                    }
                }
            }
        }

        return distances[b.length][a.length];
    }

    static fuzzySearch(query, items, context, n) {
        const results = [];

        for (const item of items) {
            if(item._name.length < 3) continue;
            const distance = MIMEUtils.levenshteinDistance(query.toLowerCase(), item._name.toLowerCase(), context);
            results.push({ item, distance });
        }

        results.sort((a, b) => a.distance - b.distance);

        return results.splice(0, n);
    }
}