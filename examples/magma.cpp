#include <magma/magma.h>

MgPhysicalDevice findBestPhysicalDevice(MgInstance instance) {
  size_t physicalDeviceCount;
  mgEnumeratePhysicalDevices(instance, nullptr, &physicalDeviceCount);
  MgPhysicalDevice *physicalDevices = new MgPhysicalDevice[physicalDeviceCount];
  mgEnumeratePhysicalDevices(instance, physicalDevices, &physicalDeviceCount);

  MgPhysicalDevice bestPhysicalDevice = nullptr;
  uint32_t bestScore = 0;
  for (size_t i = 0; i < physicalDeviceCount; ++i) {
    uint32_t score =
        mgComputePhysicalDevicePerformanceScore(instance, physicalDevices[i]);
    if (score >= bestScore) {
      bestScore = score;
      bestPhysicalDevice = physicalDevices[i];
    }
  }

  delete physicalDevices;

  return bestPhysicalDevice;
}

int main() {
  /* ... */
  MgInstance instance = /* ... */;
  MgPhysicalDevice physicalDevice = findBestPhysicalDevice(instance);
  MgDevice device =
      mgCreateDevice(instance, nullptr,
                     &(const MgDeviceCreateInfo){
                         .physicalDevice = physicalDevice, .pNext = nullptr});
  mgCmdDraw();
  /* ... */
}
