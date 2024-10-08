// Extend the Set prototype to include isSubsetOf
interface Set<T> {
  isSubsetOf(otherSet: Set<T>): boolean;
}

if (!Set.prototype.isSubsetOf) {
  Set.prototype.isSubsetOf = function <T>(
    this: Set<T>,
    otherSet: Set<T>,
  ): boolean {
    for (let elem of this) {
      if (!otherSet.has(elem)) {
        return false;
      }
    }
    return true;
  };
}
