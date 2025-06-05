using UnityEngine;

public class WeaponController : MonoBehaviour
{
    [Header("Weapon Settings")]
    public int maxAmmo = 30;
    public float fireRate = 0.1f;
    public float reloadTime = 1.2f;
    public float hitDistance = 100f;
    public float damage = 10f;

    [Header("References")]
    public ParticleSystem muzzleFlash;
    public AudioSource gunshotAudio;
    public Transform firePoint;
    public GameObject hitEffectPrefab;

    private int currentAmmo;
    private float nextFireTime;
    private bool isReloading;

    void Start()
    {
        currentAmmo = maxAmmo;
    }

    void Update()
    {
        if (isReloading) return;

        if (currentAmmo <= 0)
        {
            StartCoroutine(Reload());
            return;
        }

        if (Input.GetButton("Fire1") && Time.time >= nextFireTime)
        {
            nextFireTime = Time.time + fireRate;
            Shoot();
        }
    }

    System.Collections.IEnumerator Reload()
    {
        isReloading = true;
        yield return new WaitForSeconds(reloadTime);
        currentAmmo = maxAmmo;
        isReloading = false;
    }

    void Shoot()
    {
        currentAmmo--;
        muzzleFlash?.Play();
        gunshotAudio?.Play();

        RaycastHit hit;
        if (Physics.Raycast(firePoint.position, firePoint.forward, out hit, hitDistance))
        {
            var impact = Instantiate(hitEffectPrefab, hit.point, Quaternion.LookRotation(hit.normal));
            Destroy(impact, 2f);
            var damageable = hit.collider.GetComponent<IDamageable>();
            if (damageable != null)
            {
                damageable.TakeDamage(damage);
            }
        }
    }
}

public interface IDamageable
{
    void TakeDamage(float amount);
}
