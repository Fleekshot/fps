using UnityEngine;

public class BulletImpact : MonoBehaviour, IDamageable
{
    public float health = 50f;
    public GameObject hitEffectPrefab;

    public void TakeDamage(float amount)
    {
        health -= amount;
        if (hitEffectPrefab != null)
        {
            var effect = Instantiate(hitEffectPrefab, transform.position, Quaternion.identity);
            Destroy(effect, 1f);
        }
        if (health <= 0f)
        {
            Destroy(gameObject);
        }
    }
}
